import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Alkalmazás indításakor megnézzük, van-e elmentett token
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                // 1. Megnézzük, van-e helyi token
                const token = await SecureStore.getItemAsync('userToken');

                if (token) {
                    const response = await api.get('/users/me');

                    if (response.data) {
                        setUserToken(token);
                        setUserData(response.data);
                        await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
                    }
                }
            } catch (e) {
                console.log('Token érvénytelen vagy lejárt:', e);
                await logout();
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    // Login
    const login = async (email, password) => {
        try {
            const response = await api.post('/users/login', { email, password });
            const { token, user } = response.data;

            // Mentés a telefon biztonságos tárhelyére
            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userData', JSON.stringify(user));

            setUserToken(token);
            setUserData(user);
        } catch (error) {
            console.log(error);
            throw error; // Továbbadjuk a hibát, hogy a Login képernyő kiírhassa
        }
    };

    // Regisztráció
    const register = async (email, password, displayName) => {
        try {
            const response = await api.post('/users/register', { email, password, displayName });
            // A backend most már itt is visszaadja a tokent és a user-t!
            const { token, user } = response.data;

            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userData', JSON.stringify(user));

            setUserToken(token);
            setUserData(user);
        } catch (error) {
            console.log(error);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        setUserToken(null);
        setUserData(null);
    };

    //User adatok lokális frissítése (pl. háztartás csatlakozás után)
    const updateUser = async (newUserData) => {
        try {
            // Összefésüljük a régi adatokat az újakkal
            const mergedUser = { ...userData, ...newUserData };

            setUserData(mergedUser);
            await SecureStore.setItemAsync('userData', JSON.stringify(mergedUser));
        } catch (e) {
            console.log("User update error:", e);
        }
    };

    return (
        <AuthContext.Provider value={{ updateUser, register, login, logout, userToken, userData, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};