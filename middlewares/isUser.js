const userModel = require('../models/address');

const isLogin = async(req,res,next)=> {
    try {
        if(!req.session.user){
            return res.redirect("/user/login");
        }else{
            next();
        }
    } catch (error) {
    }
}

module.exports = {
    isLogin,
}