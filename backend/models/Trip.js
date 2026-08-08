const mongoose = require('mongoose');

/**
 * WHY embedded seats instead of a separate Seat collection?
 *
 * We need atomic seat locking: two simultaneous requests must not both succeed.
 * With an embedded array, MongoDB's findOneAndUpdate with a positional filter ($)
 * is an atomic compare-and-swap on a single document — no transactions needed.
 * A separate Seat collection would require multi-document transactions for the same
 * guarantee, which adds overhead and complexity.
 */
const SeatSchema = new mongoose.Schema({
  // seatLabel: "12" for buses, "S1-23" (coach-seat) for trains
  seatLabel:    { type: String, required: true },
  status:       { type: String, enum: ['available', 'locked', 'booked'], default: 'available' },
  // lockedBy + lockExpiresAt: who holds the 10-min reservation window
  lockedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockExpiresAt:{ type: Date, default: null },
  // bookedBy + bookingId: set permanently after Stripe payment confirmed
  bookedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { _id: false }); // _id: false — no separate _id per seat, keeps doc lean

const TripSchema = new mongoose.Schema({
  vehicleType: { type: String, enum: ['bus', 'train'], required: true },
  vehicleId:   { type: mongoose.Schema.Types.ObjectId, refPath: 'vehicleRef', required: true },
  vehicleRef:  { type: String, enum: ['Bus', 'Train'], required: true },
  routeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  driverId:    { type: mongoose.Schema.Types.ObjectId, refPath: 'driverRef', required: true },
  driverRef:   { type: String, enum: ['BusDriver', 'TrainDriver'], required: true },
  departureTime: { type: Date, required: true },
  arrivalTime:   { type: Date, required: true },
  fare:          { type: Number, required: true, min: 1 },
  platformNo:    { type: Number, default: null }, // trains only
  /**
   * Trip lifecycle:
   * scheduled → delayed → departed → completed
   *                     ↘ cancelled (admin action → triggers mass refund)
   */
  status: {
    type: String,
    enum: ['scheduled', 'delayed', 'departed', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  seats: [SeatSchema],
}, { timestamps: true });

// Index for fast seat queries
TripSchema.index({ vehicleType: 1, 'routeId': 1, departureTime: 1 });

/**
 * Helper: generate seat labels for a new trip.
 * Bus → ["1","2",...,"45"]
 * Train → ["S1-1","S1-2",...,"S12-72"]  (coach prefix S = Sleeper, A = AC)
 */
TripSchema.statics.generateSeats = function(vehicleType, capacity, totalCoaches, seatsPerCoach) {
  const seats = [];
  if (vehicleType === 'bus') {
    for (let i = 1; i <= capacity; i++) {
      seats.push({ seatLabel: String(i), status: 'available' });
    }
  } else {
    // Cap at 10 coaches × 72 seats max (720 docs) to keep document size reasonable
    const coaches = Math.min(totalCoaches, 10);
    const perCoach = Math.min(seatsPerCoach, 72);
    const prefixes = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (let c = 0; c < coaches; c++) {
      for (let s = 1; s <= perCoach; s++) {
        seats.push({ seatLabel: `${prefixes[c] || 'C'}${c + 1}-${s}`, status: 'available' });
      }
    }
  }
  return seats;
};

module.exports = mongoose.model('Trip', TripSchema);
