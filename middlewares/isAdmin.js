const isAdmin = async(req,res,next)=> {
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login")
        }else{
            next();
        }
    } catch (error) {
    }
}

module.exports = {
    isAdmin,
}