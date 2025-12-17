import api from './api';

export const getShoppingLists = async () => {
    try {
        const response = await api.get('/shopping');
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const createShoppingList = async (name) => {
    try {
        const response = await api.post('/shopping', { name });
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const deleteShoppingList = async (id) => {
    try {
        const response = await api.delete(`/shopping/${id}`);
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const addItem = async (listId, name, unit, quantity = 1) => {
    try {
        const response = await api.post(`/shopping/${listId}/items`, { name, unit, quantity });
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const toggleItem = async (itemId, isBought) => {
    try {
        const response = await api.put(`/shopping/items/${itemId}`, { isBought });
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const togglePurchased = async (itemId, purchased) => {
    try {
        const response = await api.put(`/shopping/items/${itemId}`, { purchased });
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const deleteItem = async (itemId) => {
    try {
        const response = await api.delete(`/shopping/items/${itemId}`);
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

export const updateItemQuantity = async (itemId, quantity) => {
    try {
        const response = await api.put(`/shopping/items/${itemId}`, { quantity });
        return response.data;
    } catch (e) {
        console.log(e);
    }
}