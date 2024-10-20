const mongoose = require('mongoose');
const address = require('../models/address');

const userSchema = new mongoose.Schema({
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
    addresses : [address.schema]
},{timestamps : true});

module.exports = mongoose.model('Users',userSchema);