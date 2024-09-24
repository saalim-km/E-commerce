const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username : {
        type : String,
        required : true,
    },
    email : {
        type : String,
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
        unique:true,
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
    createdOn : {
        type : Date,
        default : Date.now,
    },
    
});

module.exports = mongoose.model('Users',userSchema);