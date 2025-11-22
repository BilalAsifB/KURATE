import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      setUserId(response.data.userId);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.verifyOTP(userId, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(userId, newPassword, confirmPassword);
      alert('Password reset successful!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-2xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-2xl">
              <KeyRound className="h-16 w-16 text-indigo-600" />
            </div>
          </div>
          <h2 className="mt-8 text-center font-black text-6xl text-gray-900 tracking-tight leading-tight">
            Reset
          </h2>
          <p className="mt-3 text-center font-light text-2xl text-gray-600">
            Password
          </p>
          <p className="mt-6 text-center font-mono font-bold text-sm text-indigo-600 tracking-widest">
            STEP {step} OF 3
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-5 border-l-4 border-red-500">
            <p className="font-mono text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border-2 border-transparent font-bold text-base rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-xl"
            >
              {loading ? 'SENDING OTP...' : 'SEND OTP'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center font-semibold text-sm text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOTPSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="otp" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide text-center">
                ENTER 6-DIGIT CODE
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                className="appearance-none relative block w-full px-4 py-4 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-4xl tracking-widest text-center transition-all"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <p className="mt-3 font-mono text-xs text-gray-500 text-center tracking-wide">
                Check your email for the code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border-2 border-transparent font-bold text-base rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-xl"
            >
              {loading ? 'VERIFYING...' : 'VERIFY OTP'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="newPassword" className="block font-semibold text-sm text-gray-700 mb-2 tracking-wide">
                NEW PASSWORD
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-sm transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
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
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-sm transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border-2 border-transparent font-bold text-base rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-xl"
            >
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}