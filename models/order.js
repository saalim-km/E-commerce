const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        ref : 'Users',
        required : true,
    },
    products : [
        {
            productId : {
                type : mongoose.Types.ObjectId,
                ref : 'Products',
                required : true,
            },
            quantity : {
                type : Number,
                required : true,
            },
            size : {
                type : String,
                enum : ['S','M','L','XL'],
                required : true,
            },
            price : {
                type : Number,
                required : true,
            },
            status : {
                type : String,
                enum : ['Returned' , 'Cancelled','Delivered'],
            }
        }
    ],
    shippingAddress : {
        type : Object,
        required : true,
    },
    paymentMethod : {
        type : String,
        enum : ['COD','Razorpay'],
        required : true,
    },
    status : {
        type : String,
        enum : ['Pending','Processing','Shipped','Delivered','Cancelled','Returned'],
        default : 'Pending',
    },
    totalAmount : {
        type : Number,
        required : true,
    },
    discount : {
        type : Number
    },
    coupon : {
        type : String,
    },
    backupTotalAmount : {
        type : Number,
    }
},{timestamps : true});

module.exports = mongoose.model('Order',orderSchema);