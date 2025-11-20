import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-2xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-2xl">
              <LogIn className="h-16 w-16 text-indigo-600" />
            </div>
          </div>
          <h2 className="mt-8 text-center font-black text-6xl text-gray-900 tracking-tight leading-tight">
            Sign in
          </h2>
          <p className="mt-3 text-center font-light text-2xl text-gray-600">
            to KURATE
          </p>
          <p className="mt-6 text-center font-mono text-sm text-gray-500 tracking-wide">
            Or{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-500 underline underline-offset-4"
            >
              create new account
            </Link>
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-5 border-l-4 border-red-500">
              <p className="font-mono text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-sm transition-all"
                placeholder="user@nu.edu.pk"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-sm transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border-2 border-transparent font-bold text-base rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-xl"
          >
            {loading ? (
              <span className="font-mono tracking-wide">SIGNING IN...</span>
            ) : (
              <span className="tracking-wide">SIGN IN</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}