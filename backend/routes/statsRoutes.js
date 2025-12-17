const express = require('express');
const router = express.Router();
const { transactions, Sequelize } = require('../dbHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { Op } = Sequelize;

// Segédfüggvény: Dátum tartomány generálása egy adott hónapra
const getMonthDateRange = (year, monthIndex) => {
    // monthIndex: 0 = Január, 11 = December
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0); // Hónap utolsó napja
    end.setHours(23, 59, 59, 999); // Nap vége
    return { start, end };
};

// 1. HEATMAP ADATOK (Napi összesítés)
router.get('/heatmap', authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
        const { start, end } = getMonthDateRange(parseInt(year), parseInt(month));

        const results = await transactions.findAll({
            attributes: [
                // Kiválasztjuk a dátumot (csak a napot) és összeadjuk az összeget
                [Sequelize.fn('DATE', Sequelize.col('date')), 'date'],
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'count']
            ],
            where: {
                createdBy: req.user.id,
                type: 'EXPENSE',
                date: {
                    [Op.between]: [start, end]
                }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('date'))],
            raw: true // Fontos: tiszta JSON-t kapunk vissza, nem Sequelize példányokat
        });

        res.json(results);
    } catch (e) {
        console.error("Heatmap hiba:", e);
        res.status(500).json({ message: "Szerver hiba" });
    }
});

// 2. STACKED CHART (Életmód infláció - Havi bontás kategóriánként)
router.get('/inflation', authMiddleware, async (req, res) => {
    try {
        // Utolsó 6 hónap kiszámítása
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Hónap eleje

        const results = await transactions.findAll({
            attributes: [
                // Év és Hónap formázása (pl. "2024-05")
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
                'category',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            where: {
                createdBy: req.user.id,
                type: 'EXPENSE',
                date: {
                    [Op.gte]: sixMonthsAgo // >= 6 hónapja
                }
            },
            group: [
                Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'),
                'category'
            ],
            order: [[Sequelize.col('month'), 'ASC']],
            raw: true
        });

        res.json(results);
    } catch (e) {
        console.error("Inflation hiba:", e);
        res.status(500).json({ message: "Szerver hiba" });
    }
});

// 3. PIE CHART (Kategória megoszlás adott hónapban)
router.get('/pie', authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
        const { start, end } = getMonthDateRange(parseInt(year), parseInt(month));

        const results = await transactions.findAll({
            attributes: [
                'category',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            where: {
                createdBy: req.user.id,
                type: 'EXPENSE',
                date: {
                    [Op.between]: [start, end]
                }
            },
            group: ['category'],
            order: [[Sequelize.literal('total'), 'DESC']], // Összeg szerint csökkenő
            raw: true
        });

        res.json(results);
    } catch (e) {
        console.error("Pie hiba:", e);
        res.status(500).json({ message: "Szerver hiba" });
    }
});

// 4. ÁTLAGOK (6 és 12 havi)
router.get('/averages', authMiddleware, async (req, res) => {
    try {
        // Segédfüggvény az átlag lekéréséhez
        const getAvgData = async (months) => {
            const dateThreshold = new Date();
            dateThreshold.setMonth(dateThreshold.getMonth() - months);
            dateThreshold.setDate(1);

            const sums = await transactions.findAll({
                attributes: [
                    'category',
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
                ],
                where: {
                    createdBy: req.user.id,
                    type: 'EXPENSE',
                    date: {
                        [Op.gte]: dateThreshold
                    }
                },
                group: ['category'],
                raw: true
            });

            // Mivel a SQL AVG() függvénye rekordokra vonatkozik, nem hónapokra,
            // ezért itt JS-ben osztjuk el a hónapok számával a teljes összeget.
            return sums.map(item => ({
                category: item.category,
                avgAmount: item.totalAmount / months
            })).sort((a, b) => b.avgAmount - a.avgAmount);
        };

        const avg6 = await getAvgData(6);
        const avg12 = await getAvgData(12);

        res.json({ avg6, avg12 });
    } catch (e) {
        console.error("Averages hiba:", e);
        res.status(500).json({ message: "Szerver hiba" });
    }
});

module.exports = router;