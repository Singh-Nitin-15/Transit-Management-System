const mongoose = require('mongoose');
const crypto   = require('crypto');

/**
 * Generate a human-readable PNR: TMS-XXXXXX (6 alphanumeric uppercase chars)
 * 36^6 ≈ 2.17 billion combinations — collision probability negligible.
 */
function generatePNR() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TMS-${code}`;
}

const BookingSchema = new mongoose.Schema({
  pnr:       { type: String, unique: true, sparse: true }, // set on payment confirmation
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  seatLabel: { type: String, required: true },
  /**
   * Booking status machine:
   * pending_payment → (Stripe success) → confirmed
   *                 → (Stripe failure/expiry) → payment_failed
   * confirmed → (user cancel, ≥2h before departure) → cancelled
   *
   * IMPORTANT: status is NEVER set by the client directly.
   * Only the Stripe webhook and cancellation endpoint can change it.
   */
  status: {
    type: String,
    enum: ['pending_payment', 'confirmed', 'cancelled', 'payment_failed'],
    default: 'pending_payment',
  },
  // Stripe traceability — set by payment webhook
  stripeSessionId:        { type: String, default: null },
  stripePaymentIntentId:  { type: String, default: null },
  stripeChargeId:         { type: String, default: null },
  stripeRefundId:         { type: String, default: null },
  amountPaid:             { type: Number, default: 0 }, // in rupees (full units)
  bookedAt:               { type: Date, default: null },
  cancelledAt:            { type: Date, default: null },
}, { timestamps: true });

BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ tripId: 1, seatLabel: 1 });

BookingSchema.statics.generatePNR = generatePNR;

module.exports = mongoose.model('Booking', BookingSchema);
