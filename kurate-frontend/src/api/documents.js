import api from "./axios";

export const documentAPI = {
    getAllDocuments: async () => {
        const response = await api.get("/documents");
        return response.data;
    },

    getDocumentById: async (id) => {
        const response = await api.get(`/documents/${id}`);
        return response.data;
    },

    uploadDocument: async (file, onUploadProgress) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/documents/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        });
        return response.data;   
    },

    submitURL: async (url) => {
        const response = await api.post("/documents/url", { url });
        return response.data;
    },

    deleteDocument: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },
};