const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const Order = require('../models/order');

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


const dashboardLoad = async (req, res) => {
    try {
        
        const totalSalesResult = await Order.aggregate([                  
            { $match: { "status": "Delivered" } },  
            { $count: "totalSalesCount" }                   
        ]);
        console.log('totalsales count here ',totalSalesResult);
        // checking for totalAmount bfefore sending to front end
        const totalSalesCount = totalSalesResult.length > 0 ? totalSalesResult[0].totalSalesCount : 0;


        const overallOrderAmount = await Order.aggregate([
            {$match : {status : "Delivered"}},  
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
        ]);
        console.log('overall order amount',overallOrderAmount)
        // checking for overallAmount
        const orderAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;


        const overallDiscount = await Order.aggregate([
            {$match : {status : "Delivered"}},
            { $group: { _id: null, totalDiscount: { $sum: { $ifNull: ["$discount", 0] } } } }
        ]);
        console.log('overall discount',overallDiscount);
        // checking overall discount 
        const discount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;

        
        res.render("dashboard", {
            totalSalesCount,
            overallOrderAmount: orderAmount,
            overallDiscount: discount
        });
    } catch (error) {
        console.log("Error while loading dashboard", error.message);
        res.status(500).send("Server Error");
    }
};




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