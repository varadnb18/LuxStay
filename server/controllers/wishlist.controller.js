import User from "../models/user.model.js";

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;     
    const { hotelId } = req.body; 

    if (!hotelId) return res.status(400).json({ message: "Hotel ID required" });

    // Add hotelId to user's wishlist if not already present
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const userAlreadyHasHotel = await User.exists({
      _id: userId,
      wishlist: { $in: [hotelId] }
    });

    if (userAlreadyHasHotel) {
      return res.status(400).json({ message: "Hotel already in wishlist" });
    }


    user.wishlist.push(hotelId);
    await user.save();

    res.status(200).json({ message: "Hotel added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { hotelId } = req.body;

    if (!hotelId) return res.status(400).json({ message: "Hotel ID required" });

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove hotelId from wishlist array
    user.wishlist = user.wishlist.filter(id => id.toString() !== hotelId);

    await user.save();

    res.status(200).json({ message: "Hotel removed from wishlist", wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("wishlist");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
