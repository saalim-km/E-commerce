const productModel = require("../models/product");
const userModel = require("../models/user");

const productView = async(req,res)=> {
    try {
        if(!req.session.user){
            return res.redirect("/user/login");
        }else{
            const productId = req.params.id;
            const user = req.session.user;
            const userData = await userModel.findOne({ email: user });
            console.log("before loading the product view page", userData);
            const productData = await productModel.findById(productId).populate("category","name");
            console.log(productData);
            res.render("productView",{product : productData , user : userData});
        }
    } catch (error) {
        console.log('error while loadin the product',error.message);
    }
}



// loading shop list
const shopList = async(req,res)=> {
    try {
        if(!req.session.user){
            return res.redirect("/user/login");
        }else{
            const user = req.session.user;
            const userData = await userModel.findOne({ email: user });
            const productData = await productModel.find({isListed : true}).populate("category","name");
            res.render("shopPage",{user : userData , products : productData});
        }
    } catch (error) {
        console.log("error while loading shop page",error.message);
    }
}

module.exports = {
    productView,
    shopList
}