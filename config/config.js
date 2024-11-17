// loading env variables
const dotenv = require('dotenv');
dotenv.config()
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const dbConnect = async()=> {
    try{
        const connect = await mongoose.connect(MONGO_URI);
        console.log('DB connect aayi :)')
    }catch(err){
    }
}

module.exports = dbConnect;