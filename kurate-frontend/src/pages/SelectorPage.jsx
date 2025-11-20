import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Globe, FileText } from 'lucide-react';
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
    
    return () => {
      // Optional: clear cart when leaving
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
        setTimeout(fetchDocument, 2000);
        return;
      }

      if (doc.status === 'error') {
        setError('Document processing failed. Please try uploading again.');
        setLoading(false);
        return;
      }

      setDocument(doc);

      if (doc.parsedContent?.toc && doc.parsedContent.toc.length > 0) {
        const firstSection = doc.parsedContent.toc[0].sectionId;
        setActiveSection(firstSection);
        
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-center">
            <Loader className="animate-spin h-20 w-20 text-indigo-600 mx-auto mb-8" />
            <p className="font-mono font-semibold text-sm text-gray-600 tracking-widest uppercase">
              Loading document...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-center max-w-md bg-white p-12 rounded-2xl shadow-2xl">
            <div className="bg-red-100 p-6 rounded-2xl inline-block mb-6">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="font-black text-3xl text-gray-900 mb-4 tracking-tight">
              {error}
            </h2>
            <Link
              to="/dashboard"
              className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-center bg-white p-12 rounded-2xl shadow-2xl">
            <p className="font-bold text-xl text-gray-900 mb-4">Document not found</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header Bar */}
      <div className="bg-white border-b-4 border-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl p-3 transition-all hover:scale-110"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              
              <div className="flex items-center flex-1">
                <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                  {document.sourceType === 'url' ? (
                    <Globe className="h-6 w-6 text-indigo-600" />
                  ) : (
                    <FileText className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h1 className="font-black text-2xl text-gray-900 tracking-tight">
                    {document.title}
                  </h1>
                  <p className="font-mono text-xs text-gray-500 tracking-wider uppercase mt-1">
                    {document.sourceType === 'url' ? 'Web Page' : 'Uploaded File'}
                  </p>
                </div>
              </div>
            </div>

            <div className="font-mono text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl border-2 border-gray-200">
              <span className="font-bold">{document.parsedContent?.toc?.length || 0}</span> sections
            </div>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-0 h-full">
            {/* Left Panel - Table of Contents (20%) */}
            <div className="col-span-2 h-full overflow-hidden shadow-2xl">
              <TableOfContents
                toc={document.parsedContent?.toc || []}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
              />
            </div>

            {/* Middle Panel - Content View (50%) */}
            <div className="col-span-6 h-full overflow-hidden shadow-2xl">
              <ContentView
                content={sectionContent}
                sectionTitle={currentSection?.title || 'Content'}
                onAddSnippet={handleAddSnippet}
              />
            </div>

            {/* Right Panel - Context Cart (30%) */}
            <div className="col-span-4 h-full overflow-hidden shadow-2xl">
              <ContextCart documentId={document._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}