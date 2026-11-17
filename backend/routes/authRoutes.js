const express = require("express");

const router = express.Router();

const { register ,signIn} = require("../controllers/AuthController");
   console.log("authRoutes called");
router.post("/register", register);

router.post("/signin", signIn);
module.exports = router;