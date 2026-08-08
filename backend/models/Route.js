const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  sourceCity:      { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  destinationCity: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  distanceKm:      { type: Number, required: true, min: 1 },
});

module.exports = mongoose.model('Route', routeSchema);
