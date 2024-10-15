const express = require("express");
const router = express.Router();
const authContoller = require("../controllers/authController");
const passport = require("passport");
const userModel = require('../models/user');
const userMiddleware = require('../middlewares/isUser');

// signUp routes
router.get("/",authContoller.landingPage);
router.get("/user/signup",authContoller.signupPage);
router.post("/user/signup", authContoller.sendOtp);
router.post("/user/verify-otp", authContoller.verifyOtp);

// otp routes
router.post("/user/resend-otp", authContoller.resendOtp);

// login routes
router.get("/user/login", authContoller.loginPage);
router.post('/user/login',authContoller.verifyLogin);

// forgot password
router.get("/user/forgotPassword",authContoller.forgotPass);
router.post("/user/forgotPassword",authContoller.verifyForgotEmail);
router.post("/user/updatePassword",authContoller.updatePassword);

// logout routes
router.get('/user/logout',authContoller.userLogout);

// load home page
router.get('/home',authContoller.loadHome);



// Google Auth Routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:"/user/login"}) , async(req,res)=> {
  req.session.user = req.user.email;
  const email = req.session.user;
  const userData = await userModel.findOne({email});
  console.log(userData)
  console.log("before checking the condition");
  
  if(userData.isBlocked==1){
    console.log("before redirecting user\n");
    req.logOut((err)=> {
      if(err){
        console.log("error while login out",err.message);
      }
      req.session.user = null;
      res.clearCookie("connect.sid");

      req.flash("error","user is blocked by admin");
      return res.redirect("/user/signup");
    });
  }else{
    res.redirect('/home');
  }
});


// exporting routes
module.exports = router;

