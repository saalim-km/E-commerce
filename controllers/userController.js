const userModel = require('../models/user');

const userList = async(req,res)=> {
    try {
        let search = "";
        if(req.query.search){
            search=req.query.search;
        }
        let page = 1;
        if(req.query.page){
            page = req.query.page;
        }
        const limit = 3;
        const userData = await userModel.find({
            isAdmin : 0,
            $or : [
                {name : {$regex:".*" + search + ".*"}},
                {email : {$regex:".*" + search + ".*"}},
            ],
        }).limit(limit*1)
            .skip((page-1)*limit)
            .exec();

        const count = await userModel.find({
            isAdmin :false,
            $or : [
                {name : {$regex:".*" + search + ".*"}},
                {email : {$regex:".*" + search + ".*"}},
            ],
        }) .countDocuments();
        console.log(userData,count);
        res.render('userList',{users:userData});
    } catch (error) {
        console.log('error while loading users list',error.message);
    }
}

module.exports = {
    userList,
}