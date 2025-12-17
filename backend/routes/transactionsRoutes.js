const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { users, transactions, recurringItems, auditLogs } = require("../dbHandler")
const { Op } = require("sequelize");
const ExcelJS = require('exceljs');

// Tranzakciók lekérése
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Lekérjük a felhasználót, hogy tudjuk a householdId-t
        const currentUser = await users.findByPk(userId);
        if (!currentUser.householdId) {
            return res.status(400).json({ message: "Nem tartozol egyetlen háztartáshoz sem!" });
        }

        // 2. Dátum szűrés előkészítése (Ha nincs megadva, az aktuális hónapot vesszük)
        const startDate = req.query.startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const endDate = req.query.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // 3. Lekérdezés
        // Olyan tranzakciókat keresünk, ahol a LÉTREHOZÓ (creator) ugyanabban a háztartásban van, mint mi.
        const txs = await transactions.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: users,
                    as: 'creator',
                    where: { householdId: currentUser.householdId }, // EZ A KULCS: Csak a közös kassza tételei!
                    attributes: ['id', 'displayName'] // Csak a nevet küldjük vissza
                },
                {
                    model: recurringItems, // Ha van, látni fogjuk, melyik fix tételből jött
                    required: false // LEFT JOIN (akkor is hozza a tranzakciót, ha nincs recurringItem)
                }
            ],
            order: [['date', 'DESC'], ['createdAt', 'DESC']] // Legfrissebb elől
        });

        res.json(txs);

    } catch (error) {
        console.error("Tranzakció lekérdezési hiba:", error);
        res.status(500).json({ message: "Szerver hiba történt." });
    }
});

// ÚJ TRANZAKCIÓ 
router.post('/', authMiddleware, async (req, res) => {
    try {
        let { amount, type, category, date, description, recurringItemId } = req.body;
        const userId = req.user.id;

        // Ha nincs kategória, akkor "Egyéb"-t használjuk
        if (!category) {
            category = 'Egyéb';
        }
        // Validálás
        if (!amount || !type || !date) {
            return res.status(400).json({ message: "Hiányzó adatok (összeg, típus, dátum)!" });
        }

        const currentUser = await users.findByPk(userId);
        if (!currentUser.householdId) {
            return res.status(400).json({ message: "Nem tartozol egyetlen háztartáshoz sem!" });
        }

        // Létrehozás
        const newTx = await transactions.create({
            amount,
            type, // "INCOME" vagy "EXPENSE"
            category,
            date,
            description,
            isRecurringInstance: !!recurringItemId, // Ha van ID, akkor true
            recurringItemId: recurringItemId || null,
            createdBy: userId
        });

        // Naplózás (opcionális, de jó, ha van nyoma)
        await auditLogs.create({
            actionType: 'CREATE_TRANSACTION',
            originalData: JSON.stringify({ amount, description, type }),
            performedByUserId: userId,
            householdId: currentUser.householdId
        });

        res.status(201).json(newTx);

    } catch (error) {
        console.error("Tranzakció létrehozási hiba:", error);
        res.status(500).json({ message: "Szerver hiba történt." });
    }
});

// TRANZAKCIÓ TÖRLÉSE
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await users.findByPk(req.user.id);

        const transaction = await transactions.findByPk(id);

        if (!transaction) return res.status(404).json({ message: "Tranzakció nem található." });

        // Egyszerűsített ellenőrzés:
        if (transaction.createdBy !== user.id) {
            return res.status(403).json({ message: "Nem te adtad hozzá ezt a tranzakciót, nem tudod törölni." });
        }

        await transaction.destroy();

        // LOGOLÁS
        const { auditLogs } = require('../dbHandler');
        await auditLogs.create({
            actionType: 'DELETE_TRANSACTION',
            originalData: JSON.stringify({
                amount: transaction.amount,
                desc: transaction.description
            }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json({ message: "Sikeres törlés." });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// TRANZAKCIÓK EXPORT
router.get('/export/excel', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Formázzuk a dátumokat a biztonság kedvéért
        const start = startDate + " 00:00:00";
        const end = endDate + " 23:59:59";

        const data = await transactions.findAll({
            where: {
                // JAVÍTÁS: householdId helyett createdBy-t használunk, 
                // mert a modellben ez az oszlop szerepel
                createdBy: req.user.id,
                date: {
                    [Op.between]: [start, end]
                }
            },
            order: [['date', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tranzakciók');

        worksheet.columns = [
            { header: 'Dátum', key: 'date', width: 15 },
            { header: 'Típus', key: 'type', width: 12 },
            { header: 'Kategória', key: 'category', width: 20 },
            { header: 'Összeg (HUF)', key: 'amount', width: 15 },
            { header: 'Leírás', key: 'description', width: 30 }
        ];

        if (data.length > 0) {
            data.forEach(t => {
                worksheet.addRow({
                    date: t.date,
                    type: t.type === 'INCOME' ? 'Bevétel' : 'Kiadás',
                    category: t.category,
                    amount: t.amount,
                    description: t.description || ''
                });
            });

            // Opcionális: Összegző sor az Excel végére
            const totalIncome = data.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = data.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
            worksheet.addRow([]);
            worksheet.addRow(['Összes bevétel:', '', '', totalIncome]);
            worksheet.addRow(['Összes kiadás:', '', '', totalExpense]);
            worksheet.addRow(['Egyenleg:', '', '', totalIncome - totalExpense]);

        } else {
            worksheet.addRow(['Nincs adat a megadott időszakban']);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tranzakciok.xlsx');

        await workbook.xlsx.write(res);
        return res.status(200).end();

    } catch (e) {
        console.error("Backend Export Error:", e);
        res.status(500).json({ error: "Szerver hiba az exportáláskor", details: e.message });
    }
});



module.exports = router;