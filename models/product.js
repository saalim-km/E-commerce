const mongoose = require('mongoose');
const category = require('./category');

const productSchema = new mongoose.Schema({
    productName : {
        type : String,
        required : true,
    },
    regularPrice : {
        type : Number,
        required : true,
    },
    salesPrice : {
        type : Number,
        required : true,
    },
    description : {
        type : String,
        require : true,
    },
    quantity : {
        type :  Number,
        required : true,
    },
    images : {
        type : [String],
        required : true,
    },
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        require : true,
    },
    isListed : {
        type : Boolean,
        default : true,
    },
    status : {
        type : String,
        required : true,
        default : "Available",
    },
    sizes: {
        type : [String],
        required : true,
    }
},{timestamps : true});


module.exports = mongoose.model("Products",productSchema);