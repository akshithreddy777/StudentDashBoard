
const mongoose = require("mongoose");

const pomodoroSchema = new mongoose.Schema(
  {
    // User who owns this session
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of Pomodoro session
    sessionType: {
      type: String,
      enum: ["Work", "Short Break", "Long Break"],
      default: "Work",
      required: true,
    },

    // Session duration in minutes
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
    },

    // Whether session was completed
    completed: {
      type: Boolean,
      default: false,
    },

    // Session start time
    startedAt: {
      type: Date,
      required: true,
    },

    // Session end time
    endedAt: {
      type: Date,
      default: null,
    },

    // Optional related task
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster user-specific session retrieval
pomodoroSchema.index({ user: 1, startedAt: -1 });

// Export Pomodoro model
module.exports = mongoose.model("Pomodoro", pomodoroSchema);
