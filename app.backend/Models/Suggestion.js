const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  suggestion: { type: String, required: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
