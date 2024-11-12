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
    }
}
// post
const adminLogin = async(req,res)=> {
    try {
        const {email,password} = req.body;
        const adminData = await userModel.findOne({email,isAdmin:1});
        if(!adminData){
            return res.render('adminLogin',{message:'admin not found'})
        }
        const passMatch = await bcrypt.compare(password,adminData.password);
        if(!passMatch){
            return res.render('adminLogin',{message : "password didn't match"});
        }
        req.session.admin = adminData._id;
        res.redirect('/admin');
    } catch (error) {
    }
}


const dashboardLoad = async (req, res) => {
    try {
        
        const totalSalesResult = await Order.aggregate([                  
            { $match: { "status": "Delivered" } },  
            { $count: "totalSalesCount" }                   
        ]);
        
        const totalSalesCount = totalSalesResult.length > 0 ? totalSalesResult[0].totalSalesCount : 0;


        const overallOrderAmount = await Order.aggregate([
            {$match : {status : "Delivered"}},  
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
        ]);
       
        const orderAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;

        let discount = await Order.aggregate([{"$match" : {status : 'Delivered'}} , {$group : {_id:null , totalDiscount : { $sum : '$discount'}}}])
        
        const couponDiscount = await Order.aggregate([{"$match" : {status : 'Delivered'}} , {$group : {_id : null , totalCouponDiscount : {$sum: '$couponDiscount'}}}])


        // fetching top 10 product
        const topProducts = await Order.aggregate([
            { $unwind: "$products" },  // Split array elements into separate documents
        
            {
                $group: { _id: "$products.productId", totalQuantitySold: { $sum: '$products.quantity' } }
            },
        
            { $sort: { totalQuantitySold: -1 } },  // Sort by quantity sold in descending order
            { $limit: 10 },  // Limit to top 10 products
        
            {
                $lookup: {
                    from: "products",  // Join with `products` collection
                    localField: "_id", 
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
        
            {
                $project: {
                    _id: 1,
                    totalQuantitySold: 1,
                    productDetails: { $arrayElemAt: ['$productDetails', 0] }  // Select the first element of `productDetails` array
                }
            },
        
            {
                $lookup: {
                    from: 'categories',  // Join with `categories` collection
                    localField: "productDetails.category",  // Assuming `category` is a field in `productDetails`
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
        
            {
                $project: {
                    _id: 1,
                    totalQuantitySold: 1,
                    productDetails: 1,  // Include product details
                    categoryDetails: { $arrayElemAt: ['$categoryDetails', 0] }  // Select first element of `categoryDetails`
                }
            }
        ]);

        res.render("dashboard", {
            totalSalesCount,
            overallOrderAmount: orderAmount,
            overallDiscount: discount[0].totalDiscount,
            couponDiscount : couponDiscount[0].totalCouponDiscount,
            topProducts
        });
    } catch (error) {
        res.status(500).send("Server Error");
    }
};




const Logout = async(req,res)=> {
    try {
        req.session.admin = null;
        res.redirect("/admin/login")
    } catch (error) {
    }
}


// userlist

module.exports = {
    loadLogin,
    adminLogin,
    dashboardLoad,
    Logout,
}