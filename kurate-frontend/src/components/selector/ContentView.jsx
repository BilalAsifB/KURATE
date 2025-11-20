import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function ContentView({ content, sectionTitle, onAddSnippet }) {
  const [selectedText, setSelectedText] = useState('');
  const [showAddButton, setShowAddButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0) {
        setSelectedText(text);
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setButtonPosition({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + rect.width / 2,
        });
        
        setShowAddButton(true);
      } else {
        setShowAddButton(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  const handleAddSnippet = () => {
    if (selectedText) {
      onAddSnippet({
        type: 'text',
        content: selectedText,
        sourceSection: sectionTitle,
      });
      
      window.getSelection().removeAllRanges();
      setShowAddButton(false);
      setSelectedText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-white to-slate-50">
        <h2 className="font-bold text-3xl text-gray-900 tracking-tight leading-tight">
          {sectionTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {content ? (
          <div
            className="prose prose-lg max-w-none select-text
              prose-headings:font-bold prose-headings:tracking-tight
              prose-p:font-normal prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
              prose-strong:font-bold prose-strong:text-gray-900
              prose-code:font-mono prose-code:text-sm prose-code:bg-indigo-50 prose-code:px-2 prose-code:py-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              "
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-2xl inline-block mb-4">
                <BookOpen className="h-16 w-16 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-500">Select a section to view content</p>
            </div>
          </div>
        )}
      </div>

      {showAddButton && (
        <button
          onClick={handleAddSnippet}
          className="fixed z-50 inline-flex items-center px-5 py-3 border-2 border-transparent font-bold text-sm rounded-xl shadow-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all hover:scale-110 animate-bounce-subtle"
          style={{
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="tracking-wide">ADD TO CART</span>
        </button>
      )}
    </div>
  );
}