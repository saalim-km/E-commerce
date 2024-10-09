const isLogin = async(req,res,next)=> {
    try {
        if(!req.session.user){
            return res.redirect("/user/login");
        }else{
            next();
        }
    } catch (error) {
        console.log('error in the isLogin user middleware',error.message);
    }
}

module.exports = {
    isLogin,
}