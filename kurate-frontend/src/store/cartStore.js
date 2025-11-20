import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  cartName: 'Untitled Cart',
  
  setCartName: (name) => set({ cartName: name }),
  
  addSnippet: (snippet) => {
    const newItem = {
      id: Date.now().toString(),
      ...snippet
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  removeSnippet: (id) => {
    set((state) => ({ 
      items: state.items.filter((item) => item.id !== id) 
    }));
  },

  clearCart: () => set({ items: [], cartName: 'Untitled Cart' }),

  getCartData: () => {
    const { items, cartName } = get();
    // Format items for backend if necessary, or return as is
    return {
      name: cartName,
      snippets: items
    };
  },

  exportToMarkdown: () => {
    const { items, cartName } = get();
    let markdown = `# ${cartName}\n\n`;
    
    items.forEach((item) => {
      markdown += `### From: ${item.sourceSection || 'Unknown Section'}\n\n`;
      markdown += `${item.content}\n\n`;
      markdown += `---\n\n`;
    });
    
    return markdown;
  }
}));