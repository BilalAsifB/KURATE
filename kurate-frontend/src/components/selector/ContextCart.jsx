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
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-slate-50 border-l-4 border-purple-200">
      <div className="p-6 border-b-2 border-purple-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-1">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            {isEditingName ? (
              <div className="flex items-center flex-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 font-bold text-lg border-b-2 border-purple-600 focus:outline-none bg-transparent"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="ml-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg p-2"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="ml-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-black text-2xl text-gray-900 tracking-tight">
                  {cartName}
                </h2>
                <button
                  onClick={() => {
                    setTempName(cartName);
                    setIsEditingName(true);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-xs text-gray-600 tracking-widest uppercase">
          <span className="font-bold">{items.length} Snippet{items.length !== 1 ? 's' : ''}</span>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-bold hover:underline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-purple-100 p-6 rounded-2xl mb-6">
              <ShoppingCart className="h-16 w-16 text-purple-600" />
            </div>
            <p className="font-bold text-lg text-gray-900 mb-2">Cart is empty</p>
            <p className="font-mono text-xs text-gray-500 tracking-wide">
              Select text to add snippets
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="font-mono font-bold text-xs text-purple-600 tracking-widest uppercase">
                      Snippet {index + 1}
                    </span>
                    {item.sourceSection && (
                      <span className="ml-2 font-mono text-xs text-gray-500">
                        • {item.sourceSection}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeSnippet(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="font-normal text-sm text-gray-700 leading-relaxed line-clamp-4">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t-2 border-purple-200 bg-white space-y-3">
        <button
          onClick={handleCopyToClipboard}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
        >
          <Copy className="h-4 w-4 mr-2" />
          <span className="font-mono tracking-wide">COPY</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="font-mono tracking-wide">DOWNLOAD</span>
        </button>

        <button
          onClick={handleSaveCart}
          disabled={items.length === 0 || saving}
          className="w-full flex items-center justify-center px-4 py-4 border-2 border-transparent rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          <span className="tracking-wide">{saving ? 'SAVING...' : 'SAVE CART'}</span>
        </button>
      </div>
    </div>
  );
}
