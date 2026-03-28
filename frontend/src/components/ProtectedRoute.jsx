import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh] bg-[#050505]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
