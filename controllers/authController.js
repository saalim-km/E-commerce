// loading env variables
const dotenv = require("dotenv");
dotenv.config();
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const productModel = require("../models/product");
const walletModel = require("../models/wallet");

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
    res.send("error while loading signUpPage", error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const products = await productModel.find({isListed : true}).limit(4).populate('category','name');
    const userData = await userModel.findOne({email : req.session.user});
    if (req.session.user && userData.isBlocked==0) {
      const user = req.session.user;
      const userData = await userModel.findOne({ email: user });
      return res.render("home", { user: userData, products });
    } else {
      res.redirect("/user/login");
    }
  } catch (error) {
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
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

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
    return res.render("enter-otp");
  } catch (error) {
    return res.status(500).json({ error: "An error occurred during signup." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

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
      const userData = await newUser.save();

      
      // creating new wallet for user
      const wallet = new walletModel({
        userId : userData._id,
        balance : 10000,
      })
      await wallet.save();


      // re-setting the otp
      req.session.otp = null;

      res.json({ success: true, redirectUrl: "/user/login" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "An error occured" });
  }
};

const resendOtp = async (req, res) => {
  try {
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
    req.session.otp = otp;

    await sendMail(email, "Your OTP for verification", otp);
    if (sendMail) {
      return res.json({ success: true, message: "OTP resend successfully" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to resend OTP." });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ isAdmin: 0, email: email });
    if (!user) {
      return res.json({success : false , message : "User not found please SignUp"});
    }
    else {
      const passMatch = await bcrypt.compare(password, user.password);
      if(!passMatch){
        return res.json({success : false , message : 'Password is not matching.'});
      }
    }
    
    if (user.isBlocked) {
      return res.json({success : false , message : "user is blocked by admin"});
    }else {
      req.session.user = user.email;
      return res.json({success : true});
    }
  } catch (error) {
    res.render("login", { message: "login failed , please try again later" });
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
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
