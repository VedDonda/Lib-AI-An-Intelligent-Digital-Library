import { createContext, useContext, useState, useEffect } from "react";
import { logoutRequest, refreshTokenRequest } from "../lib/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem("accessToken");
            const savedUser = localStorage.getItem("user");

            // Case 1: Access token exists and is still valid
            if (savedToken) {
                try {
                    const payload = JSON.parse(atob(savedToken.split(".")[1]));
                    if (payload.exp * 1000 > Date.now()) {
                        setToken(savedToken);
                        if (savedUser) setUser(JSON.parse(savedUser));
                        setLoading(false);
                        return;
                    }
                } catch (_) {}
            }

            // Case 2: No access token or it's expired — try refresh token
            try {
                const res = await refreshTokenRequest();
                const newToken = res.data.accessToken;
                localStorage.setItem("accessToken", newToken);
                setToken(newToken);

                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                } else {
                    // Extract user info from the new token
                    const payload = JSON.parse(atob(newToken.split(".")[1]));
                    const userData = { _id: payload._id, name: payload.name, email: payload.email, role: payload.role };
                    setUser(userData);
                    localStorage.setItem("user", JSON.stringify(userData));
                }
            } catch (_) {
                // Refresh token also invalid/expired — fully logout
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
            }

            setLoading(false);
        };

        restoreSession();
    }, []);

    const login = (accessToken, userData) => {
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        try { await logoutRequest(token); } catch (_) { }
        setToken(null);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
