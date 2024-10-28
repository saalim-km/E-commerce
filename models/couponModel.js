const mongoose = require("mongoose");

const couponModel = mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
    },
    discountPercentage : {
        type  : Number,
        required : true,
    },
    minPrice : {
        type : Number,
        required : true,
    },
    expiryDate : {
        type : Date,
        required : true,
    },
},{timestamps : true});

module.exports =  mongoose.model("Coupons",couponModel);