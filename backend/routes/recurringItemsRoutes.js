const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { recurringItems, users, auditLogs } = require('../dbHandler');


// LISTÁZÁS
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });

        // Csak az aktív tételeket kérjük le
        const items = await recurringItems.findAll({
            where: {
                householdId: user.householdId,
                active: true
            },
            order: [['createdAt', 'DESC']]
        });

        res.json(items);
    } catch (error) {
        console.error("Fix tételek hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// LÉTREHOZÁS
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, amount, frequency, category, autoPay, payDay, startDate } = req.body;
        const user = await users.findByPk(req.user.id);

        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });
        if (!name || !amount) return res.status(400).json({ message: "Név és összeg kötelező!" });

        const newItem = await recurringItems.create({
            name,
            amount,
            frequency: frequency || 'MONTHLY',
            active: true,
            autoPay: autoPay || false,
            payDay: payDay || null,
            startDate: startDate || new Date(),
            householdId: user.householdId
        });

        // Naplózás
        await auditLogs.create({
            actionType: 'CREATE_RECURRING',
            originalData: JSON.stringify({ name, amount }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error("Létrehozási hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// MÓDOSÍTÁS
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = await users.findByPk(req.user.id);

        const item = await recurringItems.findByPk(id);

        if (!item) return res.status(404).json({ message: "Tétel nem található." });
        if (item.householdId !== user.householdId) return res.status(403).json({ message: "Nincs jogosultságod." });

        // Frissítés
        await item.update(updates);

        await auditLogs.create({
            actionType: 'UPDATE_RECURRING',
            originalData: JSON.stringify({ id, updates }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json(item);
    } catch (error) {
        console.error("Frissítési hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// TÖRLÉS / DEAKTIVÁLÁS
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await users.findByPk(req.user.id);

        const item = await recurringItems.findByPk(id);

        if (!item) return res.status(404).json({ message: "Tétel nem található." });
        if (item.householdId !== user.householdId) return res.status(403).json({ message: "Nincs jogosultságod." });

        // Nem töröljük fizikailag, csak inaktívvá tesszük
        await item.update({ active: false });

        await auditLogs.create({
            actionType: 'DELETE_RECURRING',
            originalData: JSON.stringify({ name: item.name }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json({ message: "Tétel sikeresen törölve (inaktiválva)." });
    } catch (error) {
        console.error("Törlési hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});
//teszt

module.exports = router;