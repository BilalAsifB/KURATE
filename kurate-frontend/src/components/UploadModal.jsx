import { useState } from 'react';
import { X, Link as LinkIcon, Loader } from 'lucide-react';
import { documentsAPI } from '../api/documents';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);

    try {
      const response = await documentsAPI.submitURL(url);
      alert(`Document submitted! Processing status: ${response.data.status}`);
      setUrl('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit URL');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-8 pt-8 pb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-3xl text-gray-900 tracking-tight">
                Add Document
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 border-l-4 border-red-500">
                  <p className="font-mono text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="url"
                  className="block font-semibold text-sm text-gray-700 mb-3 tracking-wide"
                >
                  ENTER URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-600" />
                  <input
                    type="url"
                    id="url"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 font-mono text-sm transition-all"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-3 bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-600">
                  <p className="font-mono text-xs text-indigo-800 tracking-wide">
                    <span className="font-bold">Phase 1:</span> URL parsing only. File upload in Phase 2.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 font-semibold text-sm text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-2 border-transparent rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all hover:scale-105 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      <span className="tracking-wide">PROCESSING...</span>
                    </>
                  ) : (
                    <span className="tracking-wide">ADD DOCUMENT</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}