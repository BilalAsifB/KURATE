import { BookOpen } from 'lucide-react';

export default function TableOfContents({ toc, activeSection, onSectionClick }) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Contents</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {toc && toc.length > 0 ? (
          <nav className="space-y-1">
            {toc.map((item, index) => (
              <button
                key={item.sectionId || index}
                onClick={() => onSectionClick(item.sectionId)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === item.sectionId
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No table of contents available
          </p>
        )}
      </div>
    </div>
  );
}