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

// TAG JÓVÁHAGYÁSA 
router.put('/members/:memberId/approve', authMiddleware, async (req, res) => {
    try {
        const { memberId } = req.params;
        const userId = req.user.id;

        // Ellenőrzés: Csak a tulajdonos hagyhat jóvá
        const household = await households.findOne({ where: { ownerId: userId } });
        if (!household) return res.status(403).json({ message: "Csak a tulajdonos kezelheti a tagokat." });

        const member = await users.findByPk(memberId);
        if (!member || member.householdId !== household.id) return res.status(404).json({ message: "A tag nem található ebben a háztartásban." });

        await member.update({ membershipStatus: 'approved' });

        await auditLogs.create({
            actionType: 'APPROVE_MEMBER',
            originalData: JSON.stringify({ memberId, memberName: member.displayName }),
            performedByUserId: userId,
            householdId: household.id
        });

        res.json({ message: "Tag jóváhagyva." });
    } catch (e) {
        res.status(500).json({ message: "Hiba történt." });
    }
});

// TAG ELTÁVOLÍTÁSA 
router.delete('/members/:memberId', authMiddleware, async (req, res) => {
    try {
        const { memberId } = req.params;
        const userId = req.user.id;

        const household = await households.findOne({ where: { ownerId: userId } });
        // Saját magát is kiléptetheti, vagy a tulajdonos törölhet mást
        // Itt egyszerűsítünk: tegyük fel, hogy most a tulajdonos töröl
        if (!household && userId !== memberId) return res.status(403).json({ message: "Nincs jogosultságod." });

        const member = await users.findByPk(memberId);
        if (!member) return res.status(404).json({ message: "Felhasználó nem található." });

        // User adatainak resetelése
        await member.update({ householdId: null, membershipStatus: 'pending' });

        // Naplózás (ha van még household ID-nk hozzá)
        if (household) {
            await auditLogs.create({
                actionType: 'REMOVE_MEMBER',
                originalData: JSON.stringify({ memberName: member.displayName }),
                performedByUserId: userId,
                householdId: household.id
            });
        }

        res.json({ message: "Tag eltávolítva." });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Hiba történt." });
    }
});

// MEGHÍVÓK LISTÁZÁSA 
router.get('/invitations/list', authMiddleware, async (req, res) => { // Fontos: 'list' az útban, hogy ne ütközzön paraméterrel
    try {
        const user = await users.findByPk(req.user.id);
        if (!user.householdId) return res.status(400).json({ message: "Nincs háztartásod." });

        // Kell importálni az 'invitations' modellt a fájl elején!
        const { invitations } = require('../dbHandler');

        const list = await invitations.findAll({
            where: { householdId: user.householdId, status: 'PENDING' }
        });
        res.json(list);
    } catch (e) {
        res.status(500).json({ message: "Hiba történt." });
    }
});

// MEGHÍVÓ KÜLDÉSE 
router.post('/invitations', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await users.findByPk(req.user.id);
        const { invitations } = require('../dbHandler');

        if (!email) {
            return res.status(400).json({ message: "Email cím megadása kötelező." });
        }

        // --- ÚJ ELLENŐRZÉS START ---

        // 1. Megnézzük, létezik-e ilyen felhasználó a rendszerben
        const targetUser = await users.findOne({ where: { email } });

        if (!targetUser) {
            return res.status(404).json({ message: "Nincs regisztrált felhasználó ezzel az email címmel." });
        }

        // 2. Extra biztonság: Ne hívhassuk meg saját magunkat
        if (targetUser.id === user.id) {
            return res.status(400).json({ message: "Saját magadat nem hívhatod meg." });
        }

        // 3. Extra biztonság: Ha már van háztartása, felesleges meghívni
        if (targetUser.householdId) {
            return res.status(400).json({ message: "Ez a felhasználó már tagja egy másik háztartásnak." });
        }

        // 4. Megnézzük, küldtünk-e már neki meghívót (hogy ne legyen duplikáció)
        const existingInvite = await invitations.findOne({
            where: {
                email: email,
                householdId: user.householdId,
                status: 'PENDING'
            }
        });

        if (existingInvite) {
            return res.status(400).json({ message: "Ennek a felhasználónak már van függőben lévő meghívója." });
        }

        // --- ÚJ ELLENŐRZÉS VÉGE ---

        // Ha minden oké, generáljuk a kódot
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const invite = await invitations.create({
            email,
            code,
            householdId: user.householdId,
            status: 'PENDING'
        });

        res.status(201).json(invite);

    } catch (e) {
        console.error("Meghívó hiba:", e);
        res.status(500).json({ message: "Hiba történt a meghívó küldésekor." });
    }
});

// MEGHÍVÓ VISSZAVONÁSA 
router.delete('/invitations/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { invitations } = require('../dbHandler');
        await invitations.destroy({ where: { id } });
        res.json({ message: "Törölve." });
    } catch (e) {
        res.status(500).json({ message: "Hiba történt." });
    }
});


module.exports = router;