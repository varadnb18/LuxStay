// server.js
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Load env from .env or fallback to env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envCandidates = [
  path.join(__dirname, ".env"),
  path.join(__dirname, "env"),
  path.join(__dirname, "../.env"),
  path.join(__dirname, "../env"),
];
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

import { connectDB } from "./config/db.js";

// Import routes & cron so they register
import authRoutes from "./routes/auth.routes.js";
import hotelRoutes from "./routes/hotel.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

import "./cron/cleanupBookedDates.js"; 

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
   process.env.FRONTEND_URL, 
    /^http:\/\/localhost:\d+$/    
  ],
  credentials: true
}));



await connectDB(process.env.MONGO_URI);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api", wishlistRoutes);

// Health check
app.get("/", (req, res) => res.send("Plan My Stay API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
