import api from './api';

export const getSavings = async () => {
    const response = await api.get('/savings');
    return response.data;
};

export const createSavingGoal = async (data) => {
    const response = await api.post('/savings', data);
    return response.data;
};

export const updateSavingBalance = async (id, amountDiff, description) => {
    const response = await api.put(`/savings/${id}/balance`, { amountDiff, description });
    return response.data;
};

export const deleteSavingGoal = async (id) => {
    const response = await api.delete(`/savings/${id}`);
    return response.data;
};

export const updateSavingGoal = async (id, data) => {
    const response = await api.put(`/savings/${id}`, data);
    return response.data;
};