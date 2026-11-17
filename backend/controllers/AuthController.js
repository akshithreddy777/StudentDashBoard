
const User = require("../models/User");
// const bcrypt = require("bcrypt");

// REGISTER USER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check whether user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = password;//await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// SIGN IN USER
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    // Generic error message
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    // Compare password with hashed password
    // const isPasswordValid = await bcrypt.compare(
    //   password,
    //   user.password
    // );
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    // Successful login
    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Sign in error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { register, signIn };
