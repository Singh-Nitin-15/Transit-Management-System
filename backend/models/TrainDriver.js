const mongoose = require('mongoose');

const trainDriverSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  employeeId:      { type: String, required: true, unique: true, trim: true },
  phone:           { type: String, required: true, match: /^[0-9]{10}$/ },
  experienceYears: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TrainDriver', trainDriverSchema);
