const express = require("express");
const router = express.Router();
const { users } = require("../dbHandler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

// Regisztráció
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password || !displayName) {
            return res.status(400).json({ message: "Minden mező kitöltése kötelező!" });
        }
        const existingUser = await users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Ezzel az email címmel már regisztráltak." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await users.create({
            email,
            password: hashedPassword,
            displayName,
            membershipStatus: 'pending' // Alapértelmezett, amíg nincs háztartása vagy nem csatlakozik
        });

        // Token generálása (hogy regisztráció után egyből be is legyen lépve)
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                displayName: newUser.displayName,
                householdId: null // Még nincs háztartása
            }
        });

    } catch (error) {
        console.error("Regisztrációs hiba:", error);
        res.status(500).json({ message: "Szerver hiba a regisztráció során." });
    }
});

// Bejelentkezés
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ellenőrzés
        if (!email || !password) {
            return res.status(400).json({ message: "Email és jelszó megadása kötelező!" });
        }

        // Felhasználó keresése
        const user = await users.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Hibás email vagy jelszó." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Hibás email vagy jelszó." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                householdId: user.householdId,
                membershipStatus: user.membershipStatus
            }
        });

    } catch (error) {
        console.error("Bejelentkezési hiba:", error);
        res.status(500).json({ message: "Szerver hiba a bejelentkezés során." });
    }
});

// Aktuális felhasználó lekérése
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Felhasználó nem található." });
        }

        res.json({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            householdId: user.householdId,
            membershipStatus: user.membershipStatus
        });
    } catch (error) {
        res.status(500).json({ message: "Hiba az adatok lekérésekor." });
    }
})





module.exports = router;