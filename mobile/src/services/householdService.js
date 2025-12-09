import api from './api';

export const getCurrentHousehold = async () => {
    try {
        const response = await api.get('/households/current');
        return response.data;
    } catch (error) {
        throw error;
    }
};