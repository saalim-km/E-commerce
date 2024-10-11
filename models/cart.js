const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        required : true,
        ref : 'Users',
    },
    productId : {
        type : mongoose.Types.ObjectId,
        required : true,
        ref : "Products",
    },
    categoryId : {
        type : mongoose.Types.ObjectId,
        required : true,
        ref : "Category",
    },
    sizes : [
        {
            size : {
                type : String,
                required : true,
                enum : ['S','M','L','XL'],
            },
            quantity : {
                type : Number,
                required : true,
                min : 1,
            },
            _id : false
        }
    ],
},{timestamps : true}); 





module.exports = mongoose.model("Cart",cartSchema);
