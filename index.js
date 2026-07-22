
import connectDB from "./src/config/db.config.js";
import app from "./src/app.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 8000;

// ✅ Call the function
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
};

startServer();