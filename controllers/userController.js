const userModel = require('../models/user');

const userList = async(req,res)=> {
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
        }else{
            let search = "";
        if(req.query.search){
            search=req.query.search;
        }
        let page = 1;
        if(req.query.page){
            page = parseInt(req.query.page);
        }
        const limit = 4;
        const userData = await userModel.find({
            isAdmin : 0,
        }).limit(limit*1)
            .skip((page-1)*limit)
            .exec();

        const count = await userModel.find({isAdmin : 0}).countDocuments();

        const totalPages = Math.ceil(count / limit);
        res.render('userList',{
            users : userData,
            currentPage : page,
            totalPages,
        });
        }
    } catch (error) {
    }
}

const userBlock = async(req,res)=> {
    try {
        const {userId} = req.body;
        const result = await userModel.findByIdAndUpdate(userId,{isBlocked : 1});
        req.session.user = null;
        res.json({success : true});
    } catch (error) {
        req.flash("error","something went wrong while blocking the user");
        res.redirect("/admin/users")
    }
}


const userUnBlock = async(req,res)=> {
    try {
        const {userId} = req.body;
        const user = await userModel.findByIdAndUpdate(userId,{isBlocked : 0});
        res.json({success:true});
    } catch (error) {
        req.flash("error","something went wrong while unblocking user");
        res.redirect("/admin/users")
    }
}
module.exports = {
    userList,
    userBlock,
    userUnBlock,
}