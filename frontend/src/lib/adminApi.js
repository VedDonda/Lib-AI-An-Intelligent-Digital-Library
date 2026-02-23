const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }
    return data;
};

export const getPendingLibrarians = async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/pending-librarians`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const approveLibrarian = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/approve-librarian/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const rejectLibrarian = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/reject-librarian/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};
