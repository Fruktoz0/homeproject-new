const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { households, users, auditLogs, dbConnection } = require('../dbHandler');

const generateInviteCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `HOME- ${randomNum}`;
}

//HÁZTARTÁS LÉTREHOZÁSA 
router.post('/create', authMiddleware, async (req, res) => {
    const transaction = await dbConnection.transaction(); // Adatbázis tranzakció indítása a biztonságért
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ message: "A háztartás nevének megadása kötelező!" });
        }

        // Ellenőrizzük, van-e már háztartása
        const user = await users.findByPk(userId);
        if (user.householdId) {
            return res.status(400).json({ message: "Már tagja vagy egy háztartásnak!" });
        }

        //  Háztartás létrehozása
        // Egyedi kód generálása (ciklus, hogy biztosan egyedi legyen)
        let inviteCode;
        let isUnique = false;
        while (!isUnique) {
            inviteCode = generateInviteCode();
            const existing = await households.findOne({ where: { inviteCode } });
            if (!existing) isUnique = true;
        }

        const newHousehold = await households.create({
            name,
            inviteCode,
            ownerId: userId,
            currency: 'HUF'
        }, { transaction });

        //  Felhasználó frissítése (hozzárendeljük a házhoz és APPROVED státusz)
        await user.update({
            householdId: newHousehold.id,
            membershipStatus: 'approved' // A tulajdonos automatikusan elfogadva
        }, { transaction });

        // Naplózás (Audit Log)
        await auditLogs.create({
            actionType: 'CREATE_HOUSEHOLD',
            originalData: JSON.stringify({ name, inviteCode }),
            performedByUserId: userId,
            householdId: newHousehold.id
        }, { transaction });

        // Ha minden sikerült, véglegesítjük a tranzakciót
        await transaction.commit();

        res.status(201).json(newHousehold);

    } catch (error) {
        await transaction.rollback(); // Hiba esetén visszavonunk mindent
        console.error("Hiba a háztartás létrehozásakor:", error);
        res.status(500).json({ message: "Szerver hiba történt." });
    }
});

// CSATLAKOZÁS KÓDDAL
router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({ message: "A csatlakozási kód megadása kötelező!" });
        }

        // Megkeressük a háztartást a kód alapján
        const targetHousehold = await households.findOne({ where: { inviteCode: code } });

        if (!targetHousehold) {
            return res.status(404).json({ message: "Érvénytelen csatlakozási kód." });
        }

        // 2. Felhasználó frissítése
        const user = await users.findByPk(userId);

        if (user.householdId) {
            return res.status(400).json({ message: "Már tagja vagy egy háztartásnak!" });
        }

        await user.update({
            householdId: targetHousehold.id,
            membershipStatus: 'pending'
        });

        // 3. Naplózás
        await auditLogs.create({
            actionType: 'JOIN_HOUSEHOLD',
            originalData: JSON.stringify({ code }),
            performedByUserId: userId,
            householdId: targetHousehold.id
        });

        res.json({ message: "Sikeres csatlakozás! Várj a jóváhagyásra.", householdId: targetHousehold.id });

    } catch (error) {
        console.error("Csatlakozási hiba:", error);
        res.status(500).json({ message: "Szerver hiba történt." });
    }
});

// SAJÁT HÁZTARTÁS ADATAI 
router.get('/current', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);

        if (!user.householdId) {
            return res.status(404).json({ message: "Nem tartozol egyetlen háztartáshoz sem." });
        }

        const household = await households.findByPk(user.householdId, {
            include: [{
                model: users,
                as: 'members',
                attributes: ['id', 'displayName', 'email', 'membershipStatus']
            }]
        });

        res.json(household);

    } catch (error) {
        console.error("Lekérdezési hiba:", error);
        res.status(500).json({ message: "Szerver hiba történt." });
    }
});

module.exports = router;