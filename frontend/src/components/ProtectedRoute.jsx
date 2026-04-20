import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <div className="text-center mt-10 text-red-500 font-bold">Access Denied: You do not have permission to view this page.</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;