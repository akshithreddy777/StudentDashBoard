const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true,
        minlength: 3
    },

    description: {
        type: String,
        trim: true,
        default: ""
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },

    dueDate: {
        type: Date,
        default: ""
    },

    category:{
        type: String,
        default: "General",
    },

    completed: {
        type: Boolean,
        default: false
    },

    completedAt: {
        type: String,
        default: null
    },

    createdAt: {
        type: Number,
        default: Date.now
    }

}, {
    versionKey: false,
    toJSON: {
        transform: (document, returnedObject) => {
            returnedObject.id = returnedObject._id.toString();
            delete returnedObject._id;
        }
    }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;