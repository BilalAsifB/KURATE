const mongoose = require('mongoose');

const contextCartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  name: {
    type: String,
    default: 'Untitled Cart'
  },
  snippets: [
    {
      type: {
        type: String,
        enum: ['text', 'table', 'image']
      },
      content: {
        type: String // The raw text, markdown table, or image URL
      },
      sourceSection: {
        type: String // e.g., "Chapter 1"
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ContextCart = mongoose.model('ContextCart', contextCartSchema);