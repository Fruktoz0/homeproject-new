import api from "./api";

export const getTransactions = async (startDate, endDate) => {
    try {
        // Ha nincs dátum, a backend az aktuális hónapot adja vissza alapból
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get('/transactions', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Új tranzakció létrehozása
export const createTransaction = async (data) => {
    try {
        const response = await api.post('/transactions', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Tranzakció törlése
export const deleteTransaction = async (id) => {
    try {
        const response = await api.delete(`/transactions/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};