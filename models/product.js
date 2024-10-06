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
        required : true,
    },
    images : {
        type : [String],
        required : true,
    },
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        required : true,
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
    sizes : [
        {
            size : {
                type : String,
                enum : ['S','M','L',"XL"],
                required : true,
            },
            stock : {
                type : Number,
                required : true,
                min : 0,
            }
        }
    ]
},{timestamps : true});


module.exports = mongoose.model("Products",productSchema);