const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        required : true,
        ref : 'Users',
    },
    products : [{
        productId : {
            type : mongoose.Types.ObjectId,
            required : true,
        }
    }]
}, {timestamps : true});

module.exports = mongoose.model("Wishlist",wishlistSchema);