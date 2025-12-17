import api from './api';

export const getRecurringItems = async () => {
    const response = await api.get('/recurring');
    return response.data;
};

export const createRecurringItem = async (data) => {
    const response = await api.post('/recurring', data);
    return response.data;
};

export const updateRecurringItem = async (id, data) => {
    const response = await api.put(`/recurring/${id}`, data);
    return response.data;
};

export const deleteRecurringItem = async (id) => {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
};