const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  title: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    enum: ['upload', 'url'],
    required: true
  },
  originalUrl: {
    type: String // If from URL
  },
  originalFilename: {
    type: String // If from upload
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  },

  // This is the most important part:
  parsedContent: {
    toc: [
      // Table of Contents
      {
        title: String,
        sectionId: String
      }
    ],
    sections: {
      // Key is the 'sectionId' from the TOC
      // Value is the content
      type: Map,
      of: String // Storing content as HTML or Markdown string
    },
    images: [
      {
        id: String,
        url: String // URLs for extracted images (if any)
      }
    ]
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
