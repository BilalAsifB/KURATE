import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import TableOfContents from '../components/selector/TableOfContents';
import ContentView from '../components/selector/ContentView';
import ContextCart from '../components/selector/ContextCart';
import { documentsAPI } from '../api/documents';
import { useCartStore } from '../store/cartStore';

export default function SelectorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addSnippet, clearCart } = useCartStore();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [sectionContent, setSectionContent] = useState('');

  useEffect(() => {
    fetchDocument();
    
    // Clear cart when component mounts
    return () => {
      // Optional: clear cart when leaving the page
      // clearCart();
    };
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await documentsAPI.getDocumentById(id);
      const doc = response.data;

      if (doc.status === 'processing') {
        setError('Document is still processing. Please wait...');
        // Poll every 2 seconds
        setTimeout(fetchDocument, 2000);
        return;
      }

      if (doc.status === 'error') {
        setError('Document processing failed. Please try uploading again.');
        setLoading(false);
        return;
      }

      setDocument(doc);

      // Set initial active section
      if (doc.parsedContent?.toc && doc.parsedContent.toc.length > 0) {
        const firstSection = doc.parsedContent.toc[0].sectionId;
        setActiveSection(firstSection);
        
        // Get section content
        if (doc.parsedContent.sections) {
          const content = doc.parsedContent.sections[firstSection] || '';
          setSectionContent(content);
        }
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
      setLoading(false);
    }
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    
    if (document?.parsedContent?.sections) {
      const content = document.parsedContent.sections[sectionId] || '';
      setSectionContent(content);
    }
  };

  const handleAddSnippet = (snippet) => {
    addSnippet(snippet);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h2>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-gray-600">Document not found</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = document.parsedContent?.toc?.find(
    (item) => item.sectionId === activeSection
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {document.title}
              </h1>
              <p className="text-sm text-gray-500">
                {document.sourceType === 'url' ? 'Web Page' : 'Uploaded File'}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {document.parsedContent?.toc?.length || 0} section(s)
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-0 h-full">
            {/* Left Panel - Table of Contents (20%) */}
            <div className="col-span-2 h-full overflow-hidden">
              <TableOfContents
                toc={document.parsedContent?.toc || []}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
              />
            </div>

            {/* Middle Panel - Content View (50%) */}
            <div className="col-span-6 h-full overflow-hidden">
              <ContentView
                content={sectionContent}
                sectionTitle={currentSection?.title || 'Content'}
                onAddSnippet={handleAddSnippet}
              />
            </div>

            {/* Right Panel - Context Cart (30%) */}
            <div className="col-span-4 h-full overflow-hidden">
              <ContextCart documentId={document._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}