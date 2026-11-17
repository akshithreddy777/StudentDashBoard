
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // User who owns this expense
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Expense title
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: 100,
    },

    // Expense amount in INR
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    // Expense category
    category: {
      type: String,
      enum: [
        "Food",
        "Transport",
        "Education",
        "Shopping",
        "Entertainment",
        "Bills",
        "Health",
        "Other",
      ],
      default: "Other",
    },

    // Additional description
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Date of expense
    expenseDate: {
      type: Date,
      default: Date.now,
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Bank Transfer",
        "Other",
      ],
      default: "UPI",
    },
  },
  {
    timestamps: true,
  }
);

// Index for user-specific expense history
expenseSchema.index({ user: 1, expenseDate: -1 });

// Export Expense model
module.exports = mongoose.model("Expense", expenseSchema);
