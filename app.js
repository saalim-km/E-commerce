// loading env variables
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const flash = require('connect-flash');
const app = express();
const authRoute = require('./routes/auth');
const dbConnect = require('./config/config');
const session = require('express-session');
const nocache = require('nocache');
const passport = require('./config/passport'); 

// session middleware
app.use(session({
    secret : process.env.SECRET_KEY,
    resave : false,
    saveUninitialized : true,
    cookie : {
        secure : false,
        httpOnly:true, 
        maxAge : 72*60*60*1000
    }
}))

// setting google auth
app.use(passport.initialize());
app.use(passport.session());

//setting flash message configuration 
app.use(flash());
app.use((req,res,next)=> {
    res.locals.message = req.flash();
    next();
})

//  template engine
app.set('view engine','ejs');
app.set("views", "./views/auth");

// serving static files
app.use(express.static('public'));

// parsing form data to req.body object
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(nocache());

// connecting to database
dbConnect();


// setting routes
app.use('/',authRoute);

app.listen(3004,()=> {
    console.log('server started running on',3004);
})