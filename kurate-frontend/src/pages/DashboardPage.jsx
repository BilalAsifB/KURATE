import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import UploadModal from '../components/UploadModal';
import DocumentList from '../components/DocumentList';
import { documentsAPI } from '../api/documents';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await documentsAPI.getAllDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id) => {
    try {
      await documentsAPI.deleteDocument(id);
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-black text-6xl text-gray-900 tracking-tight mb-3">
                Welcome back,
              </h1>
              <p className="font-light text-3xl text-indigo-600">
                {user?.name?.split(' ')[0] || 'User'}
              </p>
              <p className="mt-4 font-mono text-sm text-gray-600 tracking-wide">
                Manage your documents and context carts
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={fetchDocuments}
                disabled={loading}
                className="inline-flex items-center px-5 py-3 border-2 border-gray-300 rounded-lg font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 transition-all hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-mono">Refresh</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border-2 border-transparent rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Document
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards with typography */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-12">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-indigo-500 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-gray-500 mb-2">Total Documents</p>
                <p className="font-black text-5xl text-gray-900">{documents.length}</p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-4">
                <svg className="h-10 w-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Similar updates for other stat cards... */}
        </div>

        {/* Documents List with updated typography */}
        <div className="bg-white shadow-xl rounded-xl p-8 border-t-4 border-indigo-500">
          <h2 className="font-bold text-3xl text-gray-900 mb-6 tracking-tight">
            Your Documents
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              onRefresh={fetchDocuments}
            />
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}