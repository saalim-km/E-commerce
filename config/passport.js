const dotenv = require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/user');
const walletModel = require("../models/wallet");


passport.use(new GoogleStrategy({ 
	clientID:process.env.CLIENT_ID, // Your Credentials here. 
	clientSecret:process.env.CLIENT_SECRET, // Your Credentials here. 
	callbackURL:"http://localhost:3004/auth/google/callback", 
	passReqToCallback:true
}, 
async function (request , accessToken, regreshToken, profile , done) {
	try {
		const googleId = profile.id;
		const email = profile.emails[0].value;
		const name = profile.displayName;

		let existingUser = await userModel.findOne({email});
		if(existingUser){
			return done(null,existingUser);
		}else{
			existingUser = new userModel({
				googleId : googleId,
				email : email,
				username : name,
			});
			const userData = await existingUser.save();
			const wallet = new walletModel({
				userId : userData._id,
				balance : 0,
			})
			await wallet.save();
			return done(null,existingUser);
		}
	} catch (err) {
		return done(err,null);
	}
}
));

passport.serializeUser((user,done)=> {
	done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
		 // Fetch user by id from session
        done(null, user);  // Pass the full user object to req.user
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;