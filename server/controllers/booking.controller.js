import Booking from "../models/booking.model.js";
import Hotel from "../models/hotel.model.js";

function buildDateRangeArray(startDate, endDate) {
  const arr = [];
  const cur = new Date(startDate);
  cur.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(0,0,0,0);

  // checkout-exclusive: include dates from start up to the day BEFORE checkout
  while (cur < end) {
    arr.push(new Date(cur)); 
    cur.setDate(cur.getDate() + 1);
  }
  return arr;
}

export const createBooking = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut } = req.body;
    const customer = req.user;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    // Validate and normalize dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: "Invalid check-in or check-out date" });
    }
    checkInDate.setHours(0,0,0,0);
    checkOutDate.setHours(0,0,0,0);
    if (!(checkOutDate > checkInDate)) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }

    const dateRange = buildDateRangeArray(checkInDate, checkOutDate);

    // Do not reserve dates yet. Create a Pending booking for admin approval.
    const totalPrice = (dateRange.length) * (hotel.pricePerNight || 0);

    const booking = await Booking.create({
      customer: customer._id,
      hotel: hotel._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: "Pending",
    });

    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const getBookingHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const pastBookings = await Booking.find({
      customer: userId,
      checkOut: { $lt: today },
    })
      .populate("hotel")
      .sort({ checkOut: -1 }); 

    res.json(pastBookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getActiveAndUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBookings = await Booking.find({
      customer: userId,
      checkOut: { $gte: today },  
    })
      .populate("hotel")
      .sort({ checkIn: 1 });

    res.json(activeBookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list pending bookings
export const getPendingBookings = async (req, res) => {
  try {
    // Only pending bookings for hotels owned by this admin
    const pending = await Booking.find({ status: "Pending" })
      .populate({ path: "hotel" })
      .populate({ path: "customer", select: "name email" });

    const filtered = pending.filter(b => b.hotel && String(b.hotel.createdBy) === String(req.user._id));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve booking, reserving dates if no overlap
export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("hotel");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "Pending") return res.status(400).json({ message: "Only pending bookings can be approved" });
    if (String(booking.hotel.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "Not authorized to approve this booking" });

    const hotel = await Hotel.findById(booking.hotel._id);
    const dateRange = buildDateRangeArray(booking.checkIn, booking.checkOut);

    const overlaps = hotel.bookedDates.some(range => {
      if (!Array.isArray(range) || range.length === 0) return false;
      const existingStart = new Date(range[0]).setHours(0,0,0,0);
      const existingEndExclusive = new Date(range[range.length - 1]);
      existingEndExclusive.setHours(0,0,0,0);
      existingEndExclusive.setDate(existingEndExclusive.getDate() + 1); // make it exclusive for comparison

      const newStart = new Date(dateRange[0]).setHours(0,0,0,0);
      const newEndExclusive = new Date(dateRange[dateRange.length - 1] || dateRange[0]);
      newEndExclusive.setHours(0,0,0,0);
      newEndExclusive.setDate(newEndExclusive.getDate() + 1);

      // intervals [start, end) overlap if start < otherEnd && otherStart < end
      return (newStart < existingEndExclusive) && (existingStart < newEndExclusive);
    });
    if (overlaps) return res.status(400).json({ message: "Selected dates overlap an existing booking" });

    hotel.bookedDates.push(dateRange);
    hotel.availability = false;
    await hotel.save();

    booking.status = "Confirmed";
    await booking.save();

    res.json({ booking, hotel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: deny booking
export const denyBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "Pending") return res.status(400).json({ message: "Only pending bookings can be denied" });
    // Ensure only owner admin can deny
    const hotel = await Hotel.findById(booking.hotel);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    if (String(hotel.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "Not authorized to deny this booking" });
    booking.status = "Cancelled";
    await booking.save();
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list confirmed bookings for hotels owned by admin
export const getOwnedConfirmedBookings = async (req, res) => {
  try {
    const all = await Booking.find({ status: "Confirmed" })
      .populate({ path: "hotel" })
      .populate({ path: "customer", select: "name email" })
      .sort({ checkIn: -1 })
    const owned = all.filter(b => b.hotel && String(b.hotel.createdBy) === String(req.user._id))
    res.json(owned)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
};
