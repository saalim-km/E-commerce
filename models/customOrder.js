const { mongo } = require("mongoose");
const mongoose = require("mongoose");

const checkoutSchema = mongoose.Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        required : true,
    },
    shippingAddress : {
        type : Object,
        required : true,
    },
    design : {
        type : String,
        required : true,
    },
    totalAmount : {
        type : Number,
        required : true,
        default : 1499,
    },
    paymentMethod : {
        type : String,
        enum : ['Wallet' ,'Razorpay'],
        required : true,
    }
},{timestamps : true});

module.exports = mongoose.model("customOrder",checkoutSchema);