// routes/review.routes.js
import express from "express";
import { addReview, getHotelReviews } from "../controllers/review.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", authMiddleware, addReview);
router.get("/hotel/:hotelId", getHotelReviews);
export default router;
