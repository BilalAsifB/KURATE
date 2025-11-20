import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, Package } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b-4 border-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center group">
              <Package className="h-10 w-10 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="ml-3 font-black text-3xl text-gray-900 tracking-tight">
                KURATE
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center text-mono text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  <span className="font-medium">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-6 py-3 border-2 border-transparent font-semibold text-sm rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}