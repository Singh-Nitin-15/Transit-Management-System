const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
  trainNumber:    { type: String, required: true, unique: true, trim: true },
  trainName:      { type: String, required: true, trim: true },
  trainType:      { type: String, enum: ['Express', 'Passenger', 'Superfast', 'Rajdhani', 'Shatabdi'], required: true },
  totalCoaches:   { type: Number, required: true, default: 12, min: 1 },
  seatsPerCoach:  { type: Number, required: true, default: 72, min: 1 },
  status:         { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
