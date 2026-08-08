const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true, trim: true },
  busType:   { type: String, enum: ['AC', 'Non-AC', 'Sleeper'], required: true },
  capacity:  { type: Number, required: true, min: 1 },
  status:    { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
