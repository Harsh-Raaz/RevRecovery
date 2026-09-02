const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const { startRetryWorker } = require("./workers/retryWorker.js");

const app = express();
let retryWorker;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    if (!retryWorker) {
      retryWorker = startRetryWorker();
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "AI Revenue Recovery API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Payment routes
app.use("/api/payment", paymentRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
