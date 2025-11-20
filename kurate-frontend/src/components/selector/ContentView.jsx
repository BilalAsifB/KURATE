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
        
        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setButtonPosition({
          top: rect.top + window.scrollY - 40,
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
      
      // Clear selection
      window.getSelection().removeAllRanges();
      setShowAddButton(false);
      setSelectedText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{sectionTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {content ? (
          <div
            className="prose prose-sm max-w-none select-text"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a section to view content</p>
          </div>
        )}
      </div>

      {showAddButton && (
        <button
          onClick={handleAddSnippet}
          className="fixed z-50 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          style={{
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Cart
        </button>
      )}
    </div>
  );
}