
const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    // User who owns this goal
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Goal title
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: 150,
    },

    // Goal description
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Goal category
    category: {
      type: String,
      enum: [
        "Academic",
        "Personal",
        "Career",
        "Fitness",
        "Financial",
        "Other",
      ],
      default: "Personal",
    },

    // Target value
    target: {
      type: Number,
      required: [true, "Goal target is required"],
      min: 1,
    },

    // Current progress
    progress: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.target;
        },
        message: "Progress cannot exceed the target",
      },
    },

    // Unit of measurement
    unit: {
      type: String,
      default: "Tasks",
      trim: true,
    },

    // Goal deadline
    deadline: {
      type: Date,
      default: null,
    },

    // Goal status
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for user-specific goal retrieval
goalSchema.index({ user: 1, status: 1 });

// Export Goal model
module.exports = mongoose.model("Goal", goalSchema);
