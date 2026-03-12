import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminPage from './components/AdminPage';

const App = () => {
  const location = useLocation();
  // Hide global navbar on login/signup pages for a cleaner look
  const hideNavbar = ['/login', '/signup'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        
        {/* Simple Global Nav (Optional - Only shows if not on login/signup) */}
        {/* {!hideNavbar && (
           <nav className="p-4 bg-white shadow flex gap-6 justify-center">
             <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</Link>
             <Link to="/signup" className="text-gray-600 hover:text-blue-600 font-medium">Signup</Link>
             <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
             <Link to="/admin" className="text-red-500 hover:text-red-700 font-medium">Admin Panel</Link>
           </nav>
        )} */}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Default Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;