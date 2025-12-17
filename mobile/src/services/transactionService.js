import api from "./api";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from "expo-secure-store";

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

export const exportTransactionsToExcel = async (startDate, endDate) => {
    try {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const token = await SecureStore.getItemAsync('userToken');
        if (!token) throw new Error("Bejelentkezés szükséges");

        const fileUri = FileSystem.documentDirectory + `export_${startStr}_${endStr}.xlsx`;
        const downloadUrl = `${api.defaults.baseURL}/transactions/export/excel?startDate=${startStr}&endDate=${endStr}`;

        const downloadRes = await FileSystem.downloadAsync(
            downloadUrl,
            fileUri,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            }
        );

        if (downloadRes.status === 200) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Tranzakciók exportálása',
                UTI: 'com.microsoft.excel.xlsx'
            });
            return { success: true };
        } else {
            throw new Error(`Szerver hiba: ${downloadRes.status}`);
        }
    } catch (error) {
        console.error("Export service error:", error);
        throw error;
    }
};