import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fungsi logout yang akan di-inject dari AuthContext
let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (fn: () => void) => {
    logoutHandler = fn;
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: tangkap 401 → logout otomatis → redirect ke /login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (logoutHandler) {
                logoutHandler();
            } else {
                // Fallback jika handler belum ter-set
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
