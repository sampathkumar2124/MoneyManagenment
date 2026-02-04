require("dotenv").config();

console.log("Starting server...");
console.log("PORT from .env:", process.env.PORT || "(not set → will use 5000)");
console.log(
  "MONGODB_URI from .env:",
  process.env.MONGODB_URI ? "exists" : "MISSING!",
);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const transactionRoutes = require("./routes/transactions");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("Using port:", PORT);

app.use(cors());
app.use(express.json());

// Optional debug
console.log("\nDEBUG:");
console.log("typeof transactionRoutes:", typeof transactionRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection FAILED:", err.message));

// Routes
app.use("/api/transactions", transactionRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
