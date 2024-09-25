const express = require("express");
const router = express.Router();
const authContoller = require("../controllers/authController");
const passport = require("passport");
const userModel = require('../models/user');
const user = require("../models/user");
const authMiddleware = require('../middlewares/auth');

// signUp routes
router.get("/", authContoller.landingPage);
router.get("/user/signup",authContoller.signupPage);
router.post("/user/signup", authContoller.sendOtp);
router.post("/user/verify-otp", authContoller.verifyOtp);

// otp routes
router.post("/user/resend-otp", authContoller.resendOtp);

// login routes
router.get("/user/login", authContoller.loginPage);
router.post('/user/login',authContoller.verifyLogin);

// logout routes
router.get('/user/logout',authContoller.userLogout);

// load home page
router.get('/home',authContoller.loadHome);



// Google Auth Routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:"/user/signup"}) , async(req,res)=> {
  req.session.user = req.user.email;
  res.redirect('/home');
});
// exporting routes
module.exports = router;

