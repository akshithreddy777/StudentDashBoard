
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // User who owns this note
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Note title
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: 150,
    },

    // Note content
    content: {
      type: String,
      required: [true, "Note content is required"],
    },

    // Note tags
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Note category
    category: {
      type: String,
      default: "General",
      trim: true,
    },

    // Pin important notes
    isPinned: {
      type: Boolean,
      default: false,
    },

    // Archive notes
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster user-specific note retrieval
noteSchema.index({ user: 1, updatedAt: -1 });

// Export Note model
module.exports = mongoose.model("Note", noteSchema);
