// routes/booking.routes.js
import express from "express";
import { createBooking, getBookingHistory, getActiveAndUpcomingBookings, getPendingBookings, approveBooking, denyBooking, getOwnedConfirmedBookings } from "../controllers/booking.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();
router.post("/", authMiddleware, createBooking); // create booking (Customer)
router.get("/history", authMiddleware, getBookingHistory);
router.get("/active", authMiddleware, getActiveAndUpcomingBookings);

// Admin moderation endpoints
router.get("/pending", authMiddleware, requireRole("Admin"), getPendingBookings);
router.post("/:id/approve", authMiddleware, requireRole("Admin"), approveBooking);
router.post("/:id/deny", authMiddleware, requireRole("Admin"), denyBooking);
router.get("/owned/confirmed", authMiddleware, requireRole("Admin"), getOwnedConfirmedBookings);
export default router;
