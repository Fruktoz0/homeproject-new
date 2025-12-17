const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { savingGoals, users, auditLogs } = require('../dbHandler');

// LISTÁZÁS
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });

        const items = await savingGoals.findAll({
            where: { householdId: user.householdId },
            order: [['createdAt', 'DESC']]
        });

        res.json(items);
    } catch (error) {
        console.error("Megtakarítás hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// LÉTREHOZÁS
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, currentAmount, targetAmount, color } = req.body;
        const user = await users.findByPk(req.user.id);

        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });
        if (!name) return res.status(400).json({ message: "Név kötelező!" });

        const newGoal = await savingGoals.create({
            name,
            currentAmount: currentAmount || 0,
            targetAmount: targetAmount || null,
            color: color || '#5D9CEC',
            householdId: user.householdId
        });

        await auditLogs.create({
            actionType: 'CREATE_SAVING',
            originalData: JSON.stringify({ name, target: targetAmount }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.status(201).json(newGoal);
    } catch (error) {
        console.error("Létrehozási hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

// EGYENLEG MÓDOSÍTÁS
router.put('/:id/balance', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amountDiff, description } = req.body;
        const userId = req.user.id;
        const user = await users.findByPk(userId);

        // 1. LEKÉRJÜK AZ ADATOT ÉS ELNEVEZZÜK 'saving'-NEK
        const saving = await savingGoals.findByPk(id);

        if (!saving) {
            return res.status(404).json({ message: "Megtakarítási cél nem található." });
        }

        // Ellenőrzés: Jogosult-e módosítani (pl. ugyanaz a háztartás)
        if (saving.householdId !== user.householdId) {
            return res.status(403).json({ message: "Nincs jogosultságod ehhez a célhoz." });
        }

        // 2. SZÁMOLÁS
        // Figyeljünk, hogy számként kezeljük az adatokat
        const current = parseFloat(saving.currentAmount);
        const diff = parseFloat(amountDiff);
        const newBalance = current + diff;

        // Validáció: Ne lehessen negatívba vinni az egyenleget (opcionális, de ajánlott)
        if (newBalance < 0) {
            return res.status(400).json({ message: "Nincs elég fedezet a kivéthez." });
        }

        // 3. MENTÉS
        await saving.update({ currentAmount: newBalance });

        // 4. NAPLÓZÁS (Itt volt a hiba: most már létezik a 'saving' változó)
        const { auditLogs } = require('../dbHandler'); // Biztos, ami biztos importáljuk ide is, ha fent hiányozna

        await auditLogs.create({
            actionType: 'UPDATE_SAVING_BALANCE',
            originalData: JSON.stringify({
                savingId: saving.id,
                name: saving.name,
                diff: diff,
                newBalance: newBalance,
                description: description || (diff > 0 ? 'Befizetés' : 'Kivét')
            }),
            performedByUserId: userId,
            householdId: user.householdId
        });

        res.json(saving);

    } catch (e) {
        console.error("Egyenleg módosítás hiba:", e); // Így látjuk a konzolon a pontos hibát
        res.status(500).json({ message: "Hiba történt az egyenleg frissítésekor." });
    }
});

// ADATOK MÓDOSÍTÁSA (Név, Célösszeg, Szín)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, targetAmount, color } = req.body;
        const user = await users.findByPk(req.user.id);

        const goal = await savingGoals.findByPk(id);

        if (!goal) return res.status(404).json({ message: "Cél nem található." });
        if (goal.householdId !== user.householdId) return res.status(403).json({ message: "Nincs jogosultságod." });

        // Mentsük el a régi adatokat a loghoz
        const oldData = { name: goal.name, target: goal.targetAmount };

        await goal.update({
            name: name || goal.name,
            targetAmount: targetAmount === '' ? null : (targetAmount || goal.targetAmount), // Ha üres string jön, nullázzuk

        });

        await auditLogs.create({
            actionType: 'UPDATE_SAVING',
            originalData: JSON.stringify({
                savingId: goal.id,
                old: oldData,
                new: { name, target: targetAmount }
            }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json(goal);
    } catch (error) {
        console.error("Módosítási hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});


// TÖRLÉS
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await users.findByPk(req.user.id);

        const goal = await savingGoals.findByPk(id);

        if (!goal) return res.status(404).json({ message: "Cél nem található." });
        if (goal.householdId !== user.householdId) return res.status(403).json({ message: "Nincs jogosultságod." });

        // Soft delete (a paranoid: true miatt a destroy csak 'deletedAt'-et állít)
        await goal.destroy();

        await auditLogs.create({
            actionType: 'DELETE_SAVING',
            originalData: JSON.stringify({ name: goal.name }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json({ message: "Megtakarítási cél törölve." });
    } catch (error) {
        console.error("Törlési hiba:", error);
        res.status(500).json({ message: "Szerver hiba." });
    }
});



module.exports = router;