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
        const user = await users.findByPk(req.user.id);

        const goal = await savingGoals.findByPk(id);

        if (!goal) return res.status(404).json({ message: "Cél nem található." });
        if (goal.householdId !== user.householdId) return res.status(403).json({ message: "Nincs jogosultságod." });

        if (!amountDiff) return res.status(400).json({ message: "Összeg megadása kötelező." });

        // Új egyenleg kiszámítása (számmá alakítjuk, hogy biztos ne szövegként fűzze össze)
        const newBalance = Number(goal.currentAmount) + Number(amountDiff);

        await goal.update({ currentAmount: newBalance });

        // Naplózzuk a tranzakciót
        await auditLogs.create({
            actionType: 'UPDATE_SAVING_BALANCE',
            originalData: JSON.stringify({
                name: goal.name,
                diff: amountDiff,
                newBalance,
                reason: description
            }),
            performedByUserId: user.id,
            householdId: user.householdId
        });

        res.json(goal);
    } catch (error) {
        console.error("Egyenleg módosítás hiba:", error);
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