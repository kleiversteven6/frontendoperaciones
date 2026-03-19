import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
