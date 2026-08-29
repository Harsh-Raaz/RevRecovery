const express = require("express");
const cors = require("cors");
require("dotenv").config();


const authRoutes = require("./routes/authRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());


// Health check
app.get("/", (req, res) => {
  res.json({
    message: "AI Revenue Recovery API is running",
  });
});


// Auth routes
app.use("/api/auth", authRoutes);


// Payment routes



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