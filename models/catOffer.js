const mongoose = require('mongoose');

const catOffer = new mongoose.Schema({
    discountPercentage : {
        type : Number,
        required : true,
    },
    offerStartDate : {
        type : Date,
        required : true,
    },
    offerExpiryDate: {
        type: Date,
        required: true
    },
    offerStatus: {
        type: Boolean,
        default:true
    },
})

module.exports = new mongoose.model('catOffer',catOffer);