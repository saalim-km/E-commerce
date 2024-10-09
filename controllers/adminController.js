const bcrypt = require('bcrypt');
const userModel = require('../models/user');

// get
const loadLogin = async(req,res)=> {
    try {   
        if(req.session.admin){
            return res.redirect('/admin');
        }else{
            res.render("adminLogin",{message:null});
        }
    } catch (error) {
        console.log('error while loading admin login page',error.message); 
    }
}
// post
const adminLogin = async(req,res)=> {
    try {
        const {email,password} = req.body;
        console.log(email,password);
        const adminData = await userModel.findOne({email,isAdmin:1});
        if(!adminData){
            return res.render('adminLogin',{message:'admin not found'})
        }
        const passMatch = await bcrypt.compare(password,adminData.password);
        if(!passMatch){
            return res.render('adminLogin',{message : "password didn't match"});
        }
        req.session.admin = adminData._id;
        console.log("admin logged in",req.session.admin);
        console.log('session set : ',req.session.admin);
        res.redirect('/admin');
    } catch (error) {
        console.log('error while admin login in',error.message);
    }
}

const dashboardLoad = async(req,res)=> {
    try {
        res.render("dashboard",{});
    } catch (error) {
        console.log('error while loading dashboard',error.message);
    }
}

const Logout = async(req,res)=> {
    try {
        req.session.admin = null;
        res.redirect("/admin/login")
    } catch (error) {
        console.log("error while loging out admin",error.message);
    }
}


// userlist

module.exports = {
    loadLogin,
    adminLogin,
    dashboardLoad,
    Logout,
}