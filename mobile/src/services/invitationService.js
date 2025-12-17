import api from './api';

// Meghívók listázása
export const getInvitations = async () => {
    // Figyelj: a backend route '/api/households/invitations/list' volt
    const response = await api.get('/households/invitations/list');
    return response.data;
};

// Új meghívó küldése
export const sendInvitation = async (email) => {
    const response = await api.post('/households/invitations', { email });
    return response.data;
};

// Meghívó visszavonása
export const revokeInvitation = async (id) => {
    const response = await api.delete(`/households/invitations/${id}`);
    return response.data;
};