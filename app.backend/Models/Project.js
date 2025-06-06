const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  codeUrl:     { type: String, required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // optional
  tags:        [String],
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
