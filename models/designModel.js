const mongoose = require("mongoose");

const designSchema = mongoose.Schema({
    userId : {
        type : mongoose.Types.ObjectId,
        required : true,
    },
    image : {
        type : String,
        required : true,
    },
    price : {
        type: Number,
        required: true,
        default: 1499 
    }
},{timestamps : true});

module.exports = mongoose.model('Design',designSchema);