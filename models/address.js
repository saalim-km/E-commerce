const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
    },
    fullName : {
        type : String,
        required : true,
    },
    phone : {
        type : Number,
        required : true,
    },
    altPhone : {
        type : Number,
    },
    house : {
        type : String,
        required: true,
    },
    street : {
        type : String,
        required : true,
    },
    city : {
        type : String,
        required : true,
    },
    state : {
        type : String,
        required : true, 
    },
    pincode : {
        type : Number,
        required : true,
    },
}, { timestamps : true } );

module.exports = mongoose.model("Address",addressSchema);