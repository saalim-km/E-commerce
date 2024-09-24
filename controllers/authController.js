// loading env variables
const dotenv = require('dotenv');
dotenv.config();
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sweetAlert = require("sweetalert2");

// Configuring NodeMailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'saalimkm@gmail.com',
    pass: 'pmqusttzbjtsnljj',
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
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp; // Generates a 6-digit OTP
};

// Controllers
const landingPage = async (req, res) => {
  res.render("index");
};

const signupPage = async (req, res) => {
  res.render("signup");
};

const loginPage = async (req, res) => {
  res.render("login");
};

const sendOtp = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;
    console.log(email, username, password, phone);
    const otp = generateOtp();

    // check if the user already exists in the database
    const userData = await userModel.findOne({ email });
    if (userData) {
      req.flash('error','user alredy exists');
      return res.redirect('/user/signup');
    }

    // Store OTP and user data in the session
    req.session.otp = otp;
    req.session.userData = { email, username, password, phone };
    // send otp 
    await sendMail(email, "Your OTP for verification", otp);
    console.log('otp sent',otp);
    return res.render('enter-otp')
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "An error occurred during signup." });
  }
};


const verifyOtp = async (req, res) => {
  try {
    console.log(req.body,req.session.otp);
    const { otp } = req.body;
    console.log(otp);

    if (req.session.otp === +otp) {
      const { username, email, phone, password } = req.session.userData;

      const hashPass = await bcrypt.hash(password, 10);

      const newUser = new userModel({
        username: username,
        email: email,
        phone: phone,
        password: hashPass,
        isAdmin: 0,
        isBlocked: 0,
        googleId : null,
      });
      await newUser.save();
      console.log(newUser);
      // re-setting the otp 
      req.session.otp = null;
      console.log(req.session.otp);
      
      req.session.userId = newUser._id;
      console.log(req.session.userId);
      
      res.json({success : true , redirectUrl:"/"});
    }else{
      res.status(400).json({success :false , message :"Invalid OTP"})
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({success : false , message : "An error occured"});
  }
};


const resendOtp = async(req,res)=> {
  try {
  console.log(req.session.userData.email);
  const {email} = req.session.userData;
  if(!email){
    return res.status(400).json({success :false , message :  "session expired. Please restart the signup Process"});
  }

  const otp = generateOtp();
  console.log('resend otp : ',otp);
  req.session.otp = otp;


  await sendMail(email, "Your OTP for verification",otp);
  if(sendMail) {
    console.log('resend otp success',otp);
    return res.json({success : true , message : "OTP resend successfully"})
  }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ success: false, error: "Failed to resend OTP." });
  }
}



module.exports = {
  landingPage,
  signupPage,
  loginPage,
  sendOtp,
  verifyOtp,
  resendOtp,
};