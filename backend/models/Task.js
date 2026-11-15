const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true,
        minlength: 3
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },

    dueDate: {
        type: String,
        default: ""
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