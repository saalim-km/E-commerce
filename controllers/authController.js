// loading env variables
const dotenv = require("dotenv");
dotenv.config();
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const productModel = require("../models/product");

// Configuring NodeMailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "saalimkm@gmail.com",
    pass: "pmqusttzbjtsnljj",
  },
});

const sendMail = (to, subject, otp) => {
  return transporter.sendMail({
    from: "saalimkm@gmail.com",
    to: to,
    subject: subject,
    text: `
        Dear sir / madam,

Thank you for choosing Savage!

Your OTP is ${otp}. Please use it to complete your signup.
        `,
  });
};

// generating random 6 digit OTP
const generateOtp = () => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp; // Generates a 6-digit OTP
  } catch (error) {
    console.log("error while generating otp", error.message);
  }
};

// Controllers
const landingPage = async (req, res) => {
  try {
    const products = await productModel.find({isListed : true}).limit(4).populate('category','name');
    if (!req.session.user) {
      return res.render("home",{products});
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error);
    res.redirect("*");
  }
};

const signupPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("signup");
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error);
    res.send("error while loading signUpPage", error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const products = await productModel.find({isListed : true}).limit(4).populate('category','name');
    const userData = await userModel.findOne({email : req.session.user});
    if (req.session.user && userData.isBlocked==0) {
      const user = req.session.user;
      console.log(user);
      const userData = await userModel.findOne({ email: user });
      console.log("before loading the home page", userData);
      return res.render("home", { user: userData, products });
    } else {
      res.redirect("/user/login");
    }
  } catch (error) {
    console.log(error);
    res.status(400).send("error while loading home page");
  }
};

const loginPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error);
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;
    console.log(email, username, password, phone);

    // check if the user already exists in the database
    const userData = await userModel.findOne({ email });
    if (userData) {
      req.flash("error", "user alredy exists");
      return res.redirect("/user/signup");
    }
    // generating otp
    const otp = generateOtp();
    // Store OTP and user data in the session
    req.session.otp = otp;
    req.session.userData = { email, username, password, phone };
    // send otp
    await sendMail(email, "Your OTP for verification", otp);
    console.log("otp sent", otp);
    return res.render("enter-otp");
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "An error occurred during signup." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    console.log(req.body, req.session.otp);
    const { otp } = req.body;
    console.log(otp);

    if (parseInt(req.session.otp) === parseInt(otp)) {
      const { username, email, phone, password } = req.session.userData;

      const hashPass = await bcrypt.hash(password, 10);

      const newUser = new userModel({
        username: username,
        email: email,
        phone: phone,
        password: hashPass,
        isAdmin: 0,
        isBlocked: 0,
      });
      await newUser.save();
      console.log(newUser);

      // re-setting the otp
      req.session.otp = null;
      console.log(req.session.otp);

      res.json({ success: true, redirectUrl: "/user/login" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: "An error occured" });
  }
};

const resendOtp = async (req, res) => {
  try {
    console.log(req.session.userData.email);
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({
          success: false,
          message: "session expired. Please restart the signup Process",
        });
    }

    const otp = generateOtp();
    console.log("resend otp : ", otp);
    req.session.otp = otp;

    await sendMail(email, "Your OTP for verification", otp);
    if (sendMail) {
      console.log("resend otp success", otp);
      return res.json({ success: true, message: "OTP resend successfully" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to resend OTP." });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const user = await userModel.findOne({ isAdmin: 0, email: email });
    if (!user) {
      return res.json({success : false , message : "User not found please SignUp"});
    }
    else {
      const passMatch = await bcrypt.compare(password, user.password);
      console.log(user);
      if(!passMatch){
        return res.json({success : false , message : 'Password is not matching.'});
      }
    }
    
    if (user.isBlocked) {
      return res.json({success : false , message : "user is blocked by admin"});
    }else {
      req.session.user = user.email;
      console.log("after verifying login", req.session.user);
      return res.json({success : true});
    }
  } catch (error) {
    console.log(error);
    res.render("login", { message: "login failed , please try again later" });
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

  // forogt passwor controllers
const forgotPass = async(req,res)=> {
  try {
    if(req.session.user){
      return res.redirect("/home");
    }else{
      res.render("forgotpass");
    }
  } catch (error) {
    console.log("error while loading forgot pass page",error.message);
  }
}

const verifyForgotEmail = async(req,res)=> {
  try {
    const {email} = req.body;
    const userExists = await userModel.findOne({email});
    if(userExists){
      res.json({success : true});
    }else{
      res.json({success : false});
    }
  } catch (error) {
      res.status(500).json({success : false});
  }
}

const updatePassword = async(req,res)=> {
  try {
    const {password,email} = req.body;
    const userId = await userModel.findOne({email});
    const hashPass = await bcrypt.hash(password,10);
    const userData = await userModel.findByIdAndUpdate(userId._id,{password : hashPass});
    if(userData){
      res.json({success : true});
    }else{
      res.json({success : false})
    }
  } catch (error) {
    res.status(500).json({success : false});
  }
}
module.exports = {
  landingPage,
  signupPage,
  loginPage,
  sendOtp,
  verifyOtp,
  resendOtp,
  loadHome,
  verifyLogin,
  userLogout,
  forgotPass,
  verifyForgotEmail,
  updatePassword,
};
