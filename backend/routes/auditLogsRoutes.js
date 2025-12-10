const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { auditLogs, users } = require('../dbHandler');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });

        const logs = await auditLogs.findAll({
            where: { householdId: user.householdId },
            order: [['timestamp', 'DESC']], // Legfrissebb elől
            limit: 50, // Csak az utolsó 50 eseményt kérjük le, hogy ne lassuljon be
            include: [
                {
                    model: users,
                    as: 'actor',
                    attributes: ['displayName']
                }
            ]
        });

        res.json(logs);
    } catch (e) {
        console.error("Log hiba:", e);
        res.status(500).json({ message: "Szerver hiba." });
    }
});

module.exports = router;