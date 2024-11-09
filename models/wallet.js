const mongoose = require('mongoose');

const walletTransaction = mongoose.Schema({
    orderId : {
        type : mongoose.Types.ObjectId,
        ref : 'Order',
    }, 
    amount : {
        type : Number,
    },
    description : {
        type : String,
        enum : ['Returned' , 'Cancelled' , 'CustomOrder','Wallet Order']
    },
    transactionType : {
        type : String,
        enum : ['credit','debit']
    },
    paymentMethod : {
        type : String,
        enum : ['Razorpay' , 'COD' , 'Wallet']
    }
},{timestamps : true});


const walletSchema = mongoose.Schema({
    userId : {
        type: mongoose.Types.ObjectId,
        ref : 'Users',
        required : true
    },
    balance : {
        type : Number,
        required : true,
        default : 0,
    },
    transactions : [walletTransaction],
},{timestamps : true});

module.exports = mongoose.model("Wallet",walletSchema);