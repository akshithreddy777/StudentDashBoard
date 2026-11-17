const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Task title is required"],
        trim: true,
        minlength: 3
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
       // lowercase: true
    },

     password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minlength: 6
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

const User = mongoose.model("User", UserSchema);

module.exports = User;