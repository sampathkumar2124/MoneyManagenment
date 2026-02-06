require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const transactionRoutes = require("./routes/transactions");

const app = express();
const PORT = process.env.PORT || 5000;

// Force public DNS resolvers (helps with Jio / mobile network SRV lookup issues)
const dns = require("node:dns").promises;
try {
  dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);
  console.log("→ Public DNS servers set successfully (Cloudflare + Google)");
} catch (err) {
  console.error("→ Failed to set public DNS servers:", err.message);
}

console.log("Starting server...");
console.log(
  "PORT from .env:       ",
  process.env.PORT || "(not set → using 5000)",
);
console.log(
  "MONGODB_URI from .env:",
  process.env.MONGODB_URI ? "exists" : "MISSING!",
);
console.log("Environment:         ", process.env.NODE_ENV || "development");
console.log("Using port:          ", PORT);

app.use(cors());
app.use(express.json());

console.log("\nDEBUG:");
console.log("typeof transactionRoutes:", typeof transactionRoutes);

// MongoDB connection – optimized for flaky networks (Jio, mobile hotspots, etc.)
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // keep these – good for slow networks
    socketTimeoutMS: 90000,
    family: 4, // IPv4 force – helpful in India
    tls: true,
    // NO directConnection here!
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection FAILED");
    console.error("Error name:    ", err.name);
    console.error("Error message: ", err.message);
    if (err.reason)
      console.error("Reason:\n", JSON.stringify(err.reason, null, 2));
  });

// Routes
app.use("/api/transactions", transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop`);
});
