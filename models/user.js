const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        unique : true,
        required : true,
    },
    password : {
        type : String,
        required : false,
        unique : false,
        sparse : true,
        default : null,
    },
    googleId : {
        type : String,
        default : null,
        sparse: true,
    },
    phone : {
        type : Number,
        required : false,
    },
    isAdmin : {
        type : Number,
        default : 0,
    },
    isBlocked : {
        type : Number,
        default : 0,
    },
    cart : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Cart"
    }],
    wallet : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Wallet",
    },
    wishlist : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Wishlist",
    },
    orderHistory : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Order",
    }],
    
},{timestamps : true});

module.exports = mongoose.model('Users',userSchema);