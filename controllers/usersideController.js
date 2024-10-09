const productModel = require("../models/product");
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const addressModel = require("../models/address");
const categoryModel = require("../models/address");

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

// user profile page load
const userProfile = async(req,res)=> {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);
        res.render("userDetails",{userData : user});
    } catch (error) {
        console.log("error while loading page",error.message);
    }
}
// updating user profile 
const updateProfile = async(req,res)=> {
    try {
        const {userId , name , phone} = req.body;
        console.log(userId,name,phone);
        const userExist = await userModel.findOne({name});
        if(userExist){
            res.json({success:false});
        }else{
            const result = await userModel.findByIdAndUpdate(userId,{
                username : name,
                phone : phone,
            });
            console.log(result);
            res.json({success : true});
        }
    } catch (error) {
        console.log("error while updating the user profile",error.message);
        res.json({error : true});
    }
}


// changing password of user
// loading change password page
const passwordPage = async(req,res)=> {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);
        res.render("password",{userData : user});
    } catch (error) {
        console.log(error.message);
    }
}
// post request for changing pass
const changePass = async(req,res)=> {
    try {
        const {oldPass,newPass,userId} = req.body;
        console.log(oldPass,newPass,userId);
        const userData = await userModel.findById(userId);
        console.log(userData);
        const isMatch = await bcrypt.compare(oldPass,userData.password);
        if(!isMatch){
            res.json({success : false});
        }else { 
            const hashPass = await bcrypt.hash(newPass, 10);
            await userModel.findByIdAndUpdate(userId,{
                password : hashPass,
            });
            res.json({success : true});
        }
        console.log(isMatch);
    } catch (error) {
        console.log("error while upating password",error.message);
        res.json({success : false});
    }
}


//  address page
const addPage = async(req,res)=> {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId)
        const addressData = await addressModel.find({userId : userId});
        res.render("address",{userData : user , address : addressData});
    } catch (error) {
        console.log("error while loading address page",error.message);
    }
}
// adding address
const addAddress = async(req,res)=> {
    try {
        console.log(req.body);
        const  {
            name,
            house,
            street,
            city,
            state,
            pincode,
            phone,
            altPhone,
        } = req.body;
        const userData = await userModel.findOne({email : req.session.user});
        // checking already existing address
        const existingAdderess = await addressModel.findOne({fullName : name});
        if(!existingAdderess){
            const newAddress = new addressModel({
                userId : userData._id,
                fullName : name,
                phone : phone,
                altPhone : altPhone,
                house : house,
                street : street,
                city : city,
                state : state,
                pincode : pincode,
            })
            const savedAddress = await newAddress.save();
            res.json({success : true , address : savedAddress});
        }else {
            res.json({success : false});
        }
        
    } catch (error) {
        console.log("error while adding address",error.message);
        res.status(500).json({error : "server error"});
    }
}
// deleting address
const deleteAdd = async(req,res)=> { 
    try {
        console.log(req.body);
        const {name , addId} = req.body;
        await addressModel.findByIdAndDelete(addId);
        res.json({success : true});
    } catch (error) {
        console.log("error while deleting address",error.message);
        res.status(500).res.json({error : "an error occured while deleting address"});
    }
}
module.exports = {
    productView,
    shopList,
    userProfile,
    updateProfile,
    passwordPage,
    changePass,
    addPage,
    addAddress,
    deleteAdd,
}