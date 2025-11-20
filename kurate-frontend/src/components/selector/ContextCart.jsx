import { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Copy, 
  Save, 
  Download,
  Edit2,
  Check,
  X 
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { cartsAPI } from '../../api/carts';

export default function ContextCart({ documentId }) {
  const {
    items,
    cartName,
    setCartName,
    removeSnippet,
    clearCart,
    getCartData,
    exportToMarkdown,
  } = useCartStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(cartName);
  const [saving, setSaving] = useState(false);

  const handleSaveCart = async () => {
    if (items.length === 0) {
      alert('Cart is empty. Add some snippets first!');
      return;
    }

    setSaving(true);
    try {
      const cartData = getCartData();
      await cartsAPI.createCart({
        documentId,
        ...cartData,
      });
      alert('Cart saved successfully!');
      clearCart();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save cart');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    const markdown = exportToMarkdown();
    navigator.clipboard.writeText(markdown);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const markdown = exportToMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cartName.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveName = () => {
    setCartName(tempName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(cartName);
    setIsEditingName(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center flex-1">
            <ShoppingCart className="h-5 w-5 text-indigo-600 mr-2" />
            {isEditingName ? (
              <div className="flex items-center flex-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 text-sm font-semibold border-b-2 border-indigo-600 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="ml-2 text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="ml-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900">
                  {cartName}
                </h2>
                <button
                  onClick={() => {
                    setTempName(cartName);
                    setIsEditingName(true);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{items.length} snippet(s)</span>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Your cart is empty
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Select text to add snippets
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-indigo-600">
                      Snippet {index + 1}
                    </span>
                    {item.sourceSection && (
                      <span className="ml-2 text-xs text-gray-500">
                        • {item.sourceSection}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeSnippet(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-700 line-clamp-4">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleCopyToClipboard}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy to Clipboard
        </button>

        <button
          onClick={handleDownload}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Markdown
        </button>

        <button
          onClick={handleSaveCart}
          disabled={items.length === 0 || saving}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Cart'}
        </button>
      </div>
    </div>
  );
}