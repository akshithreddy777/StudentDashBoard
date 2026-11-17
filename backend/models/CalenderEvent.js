
const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: [true, "Event title is required"],
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        eventType: {
            type: String,
            enum: [
                "class",
                "exam",
                "assignment",
                "meeting",
                "reminder",
                "personal",
                "other"
            ],
            default: "other"
        },

        startDate: {
            type: Date,
            required: [true, "Start date is required"]
        },

        endDate: {
            type: Date,
            required: [true, "End date is required"],
            validate: {
                validator: function (value) {
                    return value > this.startDate;
                },
                message: "End date must be after start date"
            }
        },

        location: {
            type: String,
            trim: true,
            default: ""
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        status: {
            type: String,
            enum: ["upcoming", "completed", "cancelled"],
            default: "upcoming"
        },

        reminder: {
            enabled: {
                type: Boolean,
                default: false
            },
            minutesBefore: {
                type: Number,
                default: 10,
                min: 0
            }
        },

        color: {
            type: String,
            default: "#6366f1"
        },

        isAllDay: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Indexing for faster calendar queries
calendarEventSchema.index({ user: 1, startDate: 1 });
calendarEventSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model(
    "CalendarEvent",
    calendarEventSchema
);
