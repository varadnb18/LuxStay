// cron/cleanupBookedDates.js
import cron from "node-cron";
import dotenv from "dotenv";
import Hotel from "../models/hotel.model.js";
dotenv.config();

const schedule = process.env.CRON_SCHEDULE || "0 0 * * *";

cron.schedule(schedule, async () => {
  try {
    console.log("🕛 Running bookedDates cleanup job...");
    const today = new Date();
    today.setHours(0,0,0,0);

    // Fetch only necessary fields
    const hotels = await Hotel.find({}, { bookedDates: 1, availability: 1 });

    for (const hotel of hotels) {
      if (!hotel.bookedDates || hotel.bookedDates.length === 0) continue;

      const updated = hotel.bookedDates.filter(range => {
        if (!Array.isArray(range) || range.length === 0) return false;
        const last = new Date(range[range.length - 1]);
        last.setHours(0,0,0,0);
        return last >= today; // keep only ranges whose checkout >= today
      });

      // Only save if changed
      if (updated.length !== hotel.bookedDates.length) {
        hotel.bookedDates = updated;
        hotel.availability = updated.length === 0;
        await hotel.save();
      }
    }

    console.log("✅ Booked dates cleanup completed.");
  } catch (err) {
    console.error("❌ Error in bookedDates cleanup:", err);
  }
});
