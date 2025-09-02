// controllers/hotel.controller.js
import Hotel from "../models/hotel.model.js";

export const createHotel = async (req, res) => {
  try {
    const hotelData = req.body;
    hotelData.createdBy = req.user._id;

    const hotel = await Hotel.create(hotelData);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this hotel" });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedHotel);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ createdBy: req.user._id });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const searchHotels = async (req, res) => {
  try {
    const { city, state, country } = req.body;

    const myhotels = await Hotel.find({
      'location.city': city,
      'location.state': state,
      'location.country': country,
    });

    if (!myhotels.length) {
      return res.status(404).json({ message: "No hotels found for the given location" });
    }

    res.json(myhotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
