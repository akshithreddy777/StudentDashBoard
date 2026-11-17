
const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    // User who created the study session
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Subject studied
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    // Specific topic studied
    topic: {
      type: String,
      default: "",
      trim: true,
    },

    // Total study duration in minutes
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },

    // Study start time
    startedAt: {
      type: Date,
      required: true,
    },

    // Study end time
    endedAt: {
      type: Date,
      default: null,
    },

    // Date of the study session
    sessionDate: {
      type: Date,
      default: Date.now,
    },

    // Additional notes
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster user-specific study history
studySessionSchema.index({
  user: 1,
  sessionDate: -1,
});

module.exports = mongoose.model("StudySession", studySessionSchema);
