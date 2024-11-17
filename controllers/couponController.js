const couponModel = require("../models/couponModel");

const couponPage = async(req,res)=> {
    try {
        const coupons = await couponModel.find().sort({createdAt : -1})
        res.render("coupons" , {coupons})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

const addCoupon = async(req,res)=> {
    try {
        const { name, minPrice, expiryDate , discountPercentage} = req.body;
        const couponExists = await couponModel.findOne({name : name});

        if(couponExists) {
            req.flash("error","coupon already exists");
            return res.redirect("/admin/coupon");
        }


        const newCoupon = new couponModel({
            name: name.toUpperCase(),
            minPrice,
            expiryDate: expiryDate,
            discountPercentage: discountPercentage,
        });

        const result = await newCoupon.save();
        if(result){
            req.flash("success" , "coupon added successfully");
            res.redirect('/admin/coupon');
        }
    } catch (error) {
        req.flash("error" , "An error occured please try again later");
        res.redirect('/admin/coupon');
    }
}

const deleteCoupon = async(req,res)=> {
    try {
        const {couponId} = req.body;
        const update = await couponModel.findByIdAndDelete(couponId);
        if(update) {
            res.json({success : true});
        }else{ 
            res.json({success : false});
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success : false});
    }
}
module.exports = {
    couponPage,
    addCoupon,
    deleteCoupon
}