const mongoose = require('mongoose');
const offer = require("../models/offerModel");


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    categoryOffer : [offer.schema],
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);