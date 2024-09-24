const express = require("express");
const router = express.Router();
const authContoller = require("../controllers/authController");
const passport = require("passport");

// signUp routes
router.get("/", authContoller.landingPage);
router.get("/user/signup", authContoller.signupPage);
router.post("/user/signup", authContoller.sendOtp);
router.post("/user/verify-otp", authContoller.verifyOtp);

// otp routes
router.post("/user/resend-otp", authContoller.resendOtp);

// login routes
router.get("/user/login", authContoller.loginPage);

// Google Auth Routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:"/user/signup"}) , (req,res)=> {
	res.redirect('/');
});
module.exports = router;

