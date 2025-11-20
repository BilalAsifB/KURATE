import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    clearError();
    setValidationError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-2xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <div className="bg-purple-100 p-4 rounded-2xl">
              <UserPlus className="h-16 w-16 text-purple-600" />
            </div>
          </div>
          <h2 className="mt-8 text-center font-black text-6xl text-gray-900 tracking-tight leading-tight">
            Create
          </h2>
          <p className="mt-3 text-center font-light text-2xl text-gray-600">
            your account
          </p>
          <p className="mt-6 text-center font-mono text-sm text-gray-500 tracking-wide">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-bold text-purple-600 hover:text-purple-500 underline underline-offset-4"
            >
              sign in
            </Link>
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          {(error || validationError) && (
            <div className="rounded-xl bg-red-50 p-5 border-l-4 border-red-500">
              <p className="font-mono text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                FULL NAME
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-600 font-mono text-sm transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-600 font-mono text-sm transition-all"
                placeholder="user@nu.edu.pk"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="mt-2 font-mono text-xs text-gray-500 tracking-wide">
                Must be @nu.edu.pk email
              </p>
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
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-600 font-mono text-sm transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="mt-2 font-mono text-xs text-gray-500 tracking-wide">
                Min 8 chars · 1 uppercase · 1 number · 1 special
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-600 font-mono text-sm transition-all"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border-2 border-transparent font-bold text-base rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-xl"
          >
            {loading ? (
              <span className="font-mono tracking-wide">CREATING ACCOUNT...</span>
            ) : (
              <span className="tracking-wide">CREATE ACCOUNT</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}