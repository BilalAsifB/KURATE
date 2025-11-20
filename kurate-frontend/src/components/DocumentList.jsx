import { FileText, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentList({ documents, onDelete, onRefresh }) {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'processing':
        return <Clock className="h-6 w-6 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready':
        return 'READY';
      case 'processing':
        return 'PROCESSING';
      case 'error':
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'border-green-500 bg-green-50';
      case 'processing':
        return 'border-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const handleDocumentClick = (doc) => {
    if (doc.status === 'ready') {
      navigate(`/selector/${doc._id}`);
    } else if (doc.status === 'processing') {
      alert('Document is still processing. Please wait...');
      onRefresh();
    } else {
      alert('Document processing failed. Please try uploading again.');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-indigo-100 p-6 rounded-2xl inline-block mb-6">
          <FileText className="h-16 w-16 text-indigo-600" />
        </div>
        <h3 className="font-bold text-2xl text-gray-900 mb-2">No documents yet</h3>
        <p className="font-mono text-sm text-gray-500 tracking-wide">
          Get started by adding a new document
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className={`relative bg-white p-6 rounded-2xl border-4 ${getStatusColor(doc.status)} hover:shadow-2xl transition-all cursor-pointer group hover:scale-[1.02]`}
          onClick={() => handleDocumentClick(doc)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {doc.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                {getStatusIcon(doc.status)}
                <span className="font-mono font-bold text-xs tracking-widest text-gray-600">
                  {getStatusText(doc.status)}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs text-gray-500 tracking-wide">
                <p>
                  <span className="font-semibold">TYPE:</span>{' '}
                  {doc.sourceType === 'url' ? 'Web Page' : 'File'}
                </p>

                {doc.parsedContent?.toc && (
                  <p>
                    <span className="font-semibold">SECTIONS:</span>{' '}
                    {doc.parsedContent.toc.length}
                  </p>
                )}

                <p>
                  <span className="font-semibold">ADDED:</span>{' '}
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this document?')) {
                  onDelete(doc._id);
                }
              }}
              className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}