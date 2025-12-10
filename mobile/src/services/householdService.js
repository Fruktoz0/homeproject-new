import api from './api';

// Aktuális háztartás lekérése
export const getCurrentHousehold = async () => {
    try {
        const response = await api.get('/households/current');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Tag jóváhagyása (Csak tulajdonosnak)
export const approveMember = async (memberId) => {
    const response = await api.put(`/households/members/${memberId}/approve`);
    return response.data;
};

// Tag eltávolítása vagy Kilépés
// Ha memberId === saját ID, akkor az kilépésnek számít
export const removeMember = async (memberId) => {
    const response = await api.delete(`/households/members/${memberId}`);
    return response.data;
};