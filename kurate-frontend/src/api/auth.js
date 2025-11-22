import api from "./axios";

export const authAPI = {
    register: async (userData) => {
        const response = await api.post("/users/register", userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post("/users/login", credentials);
        return response.data;
    },

    logout: async () => {
        const response = await api.post("/users/logout");
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await api.post("/users/forgot-password", { email });
        return response.data;
    },

    verifyOTP: async (userId, otp) => {
        const response = await api.post("/users/verify-otp", { userId, otp });
        return response.data;
    },

    changePassword: async (userId, newPassword, confirmPassword) => {
        const response = await api.post("/users/change-password", {
            userId,
            newPassword,
            confirmPassword,
        });
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        const response = await api.post("/users/refresh-token", { refreshToken });
        return response.data;
    },
};