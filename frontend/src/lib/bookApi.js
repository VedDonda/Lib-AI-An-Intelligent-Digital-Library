const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }
    return data;
};

export const getAllBooks = async () => {
    const response = await fetch(`${API_BASE_URL}/books`, {
        credentials: "include",
    });
    return handleResponse(response);
};

export const getBook = async (id) => {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        credentials: "include",
    });
    return handleResponse(response);
};

export const uploadBook = async (formData, token) => {
    const response = await fetch(`${API_BASE_URL}/books`, {
        method: "POST",
        credentials: "include",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    return handleResponse(response);
};

export const deleteBook = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const updateBook = async (id, formData, token) => {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    return handleResponse(response);
};
