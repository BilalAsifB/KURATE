import { FileText, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentList({ documents, onDelete, onRefresh }) {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
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
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new document.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="relative bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleDocumentClick(doc)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {doc.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                {getStatusIcon(doc.status)}
                <span className="text-sm text-gray-500">
                  {getStatusText(doc.status)}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {doc.sourceType === 'url' ? 'Web Page' : 'Uploaded File'}
              </p>

              {doc.parsedContent?.toc && (
                <p className="mt-1 text-xs text-gray-500">
                  {doc.parsedContent.toc.length} section(s)
                </p>
              )}

              <p className="mt-2 text-xs text-gray-400">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this document?')) {
                  onDelete(doc._id);
                }
              }}
              className="ml-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}