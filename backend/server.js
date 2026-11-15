const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

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

// Task routes
app.use("/api/tasks", taskRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});