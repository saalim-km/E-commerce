const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    discountPercentage : {
        type : Number,
        required : true,
    },
    discountAmount : {
        type : Number,
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

module.exports = new mongoose.model('Offer',offerSchema);