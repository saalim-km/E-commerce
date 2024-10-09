const isAdmin = async(req,res,next)=> {
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login")
        }else{
            next();
        }
    } catch (error) {
        console.log("error in the isAdmin middleware ",error.message);
    }
}

module.exports = {
    isAdmin,
}