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
        console.log('count of documents',count);
        // console.log(userData," , count of documents in the user list : ",count);
        res.render('userList',{
            users : userData,
            currentPage : page,
            totalPages,
        });
        }
    } catch (error) {
        console.log('error while loading users list',error.message);
    }
}

const userBlock = async(req,res)=> {
    try {
        const userId = req.params.id;
        const result = await userModel.findByIdAndUpdate(userId,{isBlocked : 1});
        // req.session.user = null;
        // console.log('session set null after blocking user');
        req.flash("success","User has been Blocked");
        res.redirect("/admin/users");
    } catch (error) {
        console.log('error while blocking user',error.message);
        req.flash("error","something went wrong while blocking the user");
        res.redirect("/admin/users")
    }
}


const userUnBlock = async(req,res)=> {
    try {
        const userId = req.params.id;
        const user = await userModel.findByIdAndUpdate(userId,{isBlocked : 0});
        // req.session.user = user.email;
        // console.log('session set after unbBlocking user');
        
        req.flash("success","user has been unBlocked");
        console.log("after Un-Blocking the user : ",user);
        res.redirect("/admin/users");
    } catch (error) {
        console.log('error while Un-Blocking user',error.message);
        req.flash("error","something went wrong while unblocking user");
        res.redirect("/admin/users")
    }
}
module.exports = {
    userList,
    userBlock,
    userUnBlock,
}