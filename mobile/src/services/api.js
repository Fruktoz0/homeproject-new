import axios from "axios";
import * as SecureStore from "expo-secure-store";


const API_URL = "http://newhomeproject.ddns.net:3006/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor: Minden kérés előtt megnézzük, van-e tokenünk, és ha igen, csatoljuk
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
