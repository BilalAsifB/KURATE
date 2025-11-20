import api from "./axios";

export const cartsAPI = {
    getAllUserCarts: async () => {
        const response = await api.get("/carts");
        return response.data;
    },

    getCartsByDocument: async (documentId) => {
        const response = await api.get(`/carts/document/${documentId}`);
        return response.data;
    },

    createCart: async (cartData) => {
        const response = await api.post("/cart", cartData);
        return response.data;
    },

    updateCart: async (cartId, cartData) => {
        const response = await api.put(`/cart/${cartId}`, cartData);
        return response.data;
    },

    deleteCart: async (cartId) => {
        const response = await api.delete(`/cart/${cartId}`);
        return response.data;
    },  
};