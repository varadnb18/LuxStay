// controllers/review.controller.js
import Review from "../models/review.model.js";
import Hotel from "../models/hotel.model.js";
import Booking from "../models/booking.model.js";

export const addReview = async (req, res) => {
  try {
    const { hotelId, rating, comment } = req.body;
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0,0,0,0);

    const pastBooking = await Booking.findOne({
      customer: userId,
      hotel: hotelId,
      checkOut: { $lt: today }
    });

    if (!pastBooking) {
      return res.status(403).json({ message: "You can only review hotels you have stayed in." });
    }

    const review = await Review.create({
      hotel: hotelId,
      customer: userId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getHotelReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId }).populate("customer", "name");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
