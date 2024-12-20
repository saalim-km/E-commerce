// loading env variables
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const flash = require('connect-flash');
const app = express();
const authRoute = require('./routes/auth');
const adminRoute = require('./routes/adminrouter');
const userRoute = require("./routes/userRoute")
const dbConnect = require('./config/config');
const session = require('express-session');
const nocache = require('nocache');
const passport = require('./config/passport'); 
const path = require('path');

// session middleware
app.use(session({ 
    secret : process.env.SECRET_KEY,
    resave : false,
    saveUninitialized : true,
    cookie: {
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
}));

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
app.set('views',[
    path.join(__dirname,"views/auth") ,
    path.join(__dirname , "views/admin"), 
    path.join(__dirname,"views/user"),
]);

// serving static files
app.use(express.static('public'));

// parsing form data to req.body object
app.use(express.urlencoded({limit : '10mb' , extended:true}));
app.use(express.json({ limit: '10mb' }));

// setting nocache (not for storing files in the browser).
app.use(nocache());

// connecting to database
dbConnect();

// setting routes
app.use('/',authRoute);
app.use('/admin',adminRoute);
app.use('/user',userRoute);


app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Page Not Found' });
});


const PORT = process.env.PORT || 3008
app.listen(PORT, ()=> {
    console.log('server started running');
})