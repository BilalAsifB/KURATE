import { BookOpen } from 'lucide-react';

export default function TableOfContents({ toc, activeSection, onSectionClick }) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-slate-50 border-r-4 border-indigo-200">
      <div className="p-6 border-b-2 border-indigo-200 bg-white">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="font-black text-2xl text-gray-900 tracking-tight">Contents</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {toc && toc.length > 0 ? (
          <nav className="space-y-2">
            {toc.map((item, index) => (
              <button
                key={item.sectionId || index}
                onClick={() => onSectionClick(item.sectionId)}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeSection === item.sectionId
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 hover:scale-102'
                }`}
              >
                <span className="font-mono text-xs opacity-60 block mb-1">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {item.title}
              </button>
            ))}
          </nav>
        ) : (
          <div className="text-center py-12">
            <p className="font-mono text-sm text-gray-500">No sections available</p>
          </div>
        )}
      </div>
    </div>
  );
}