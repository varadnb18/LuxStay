import express from "express";

import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/wishlist", authMiddleware, addToWishlist);   // add hotel to wishlist
router.get("/wishlist", authMiddleware, getWishlist);     // get user's wishlist
router.delete("/wishlist", authMiddleware, removeFromWishlist);


export default router;
