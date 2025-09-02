// models/review.model.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true }
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);
