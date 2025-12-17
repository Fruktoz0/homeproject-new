const express = require('express');
const router = express.Router();
const { shoppingLists, shoppingItems, users } = require('../dbHandler');
const authMiddleware = require('../middleware/authMiddleware');


// Összes lista lekérése (Háztartás alapján)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        const lists = await shoppingLists.findAll({
            where: { householdId: user.householdId },
            include: [
                {
                    model: shoppingItems,
                    include: [{ model: users, as: 'creator', attributes: ['displayName'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(lists);
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Hiba" });
    }
});

// Új lista
router.post('/', authMiddleware, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id);
        const newList = await shoppingLists.create({
            name: req.body.name,
            householdId: user.householdId,
            createdBy: user.id
        });
        res.json(newList);
    } catch (e) { res.status(500).json({ message: "Hiba" }); }
});

// Lista törlése
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await shoppingLists.destroy({ where: { id: req.params.id } });
        res.json({ message: "Törölve" });
    } catch (e) { res.status(500).json({ message: "Hiba" }); }
});

// Tétel hozzáadása
router.post('/:listId/items', authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;
        const { name, unit, quantity } = req.body;

        const addedBy = req.user.id;

        const newItem = await shoppingItems.create({
            list_id: listId,
            name,
            unit,
            quantity: quantity || 1,
            added_by: addedBy,
            purchased: false
        });
        console.log("newItem", newItem);
        // await shoppingLists.update({ status: 'ACTIVE' }, { where: { id: listId } });

        const itemWithCreator = await shoppingItems.findByPk(newItem.id, {
            include: [{ model: users, as: 'creator', attributes: ['displayName'] }]
        });
        res.status(201).json(itemWithCreator || newItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Tétel státusz módosítása (PIPÁLÁS) + AUTOMATIKUS LEZÁRÁS
router.put('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { isBought, quantity } = req.body;

        const updateData = {};
        if (isBought !== undefined) updateData.purchased = isBought;
        if (quantity !== undefined) updateData.quantity = quantity;

        // 1. Elem frissítése
        await shoppingItems.update(updateData, { where: { id: itemId } });

        // 2. Frissített elem lekérése
        const updatedItem = await shoppingItems.findByPk(itemId);

        // --- "MINDEN KÉSZ" ELLENŐRZÉS (MEGTARTVA!) ---
        if (updatedItem) {
            const listId = updatedItem.list_id;

            const allItems = await shoppingItems.findAll({ where: { list_id: listId } });

            // Ha minden elem 'purchased' true
            const allPurchased = allItems.every(item => item.purchased);

            // Státusz frissítése: Ha minden kész -> COMPLETED, amúgy ACTIVE
            const newStatus = allPurchased ? 'COMPLETED' : 'ACTIVE';

            await shoppingLists.update(
                { status: newStatus },
                { where: { id: listId } }
            );
        }

        res.json(updatedItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Tétel törlése
router.delete('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        await shoppingItems.destroy({ where: { id: req.params.itemId } });
        res.json({ message: "Törölve" });
    } catch (e) { res.status(500).json({ message: "Hiba" }); }
});

//teszt
module.exports = router;