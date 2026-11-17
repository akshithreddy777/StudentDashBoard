const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require('cors');
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();
app.use(cors());

// Connect MongoDB
connectDB();

// Middleware
app.use(express.json());

// Frontend
app.use(express.static(path.join(__dirname, "public")));

// API health check
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "StudyDeck API is running"
    });
});
 console.log("vema");
// Task routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 5000;
console.log("hi");
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});