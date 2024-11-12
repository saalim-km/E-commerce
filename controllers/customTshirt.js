const cloudinary = require("../config/cloudinary");
const Design = require("../models/designModel");
const User = require("../models/user");
const Wallet = require("../models/wallet");
const customOrder = require("../models/customOrder");
const { ObjectId } = require("mongoose").Types;


const loadCustomPage = async(req,res)=> {
    try {
        res.render("custom")
    } catch (error) {
    }
}


const designPage = async(req,res)=> {
    try {
        const {color} = req.query;
        let tshirtImageUrl;
        if(color == 'white'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730554192/https___d1e00ek4ebabms.cloudfront.net_production_bb4d4c4d-3305-40a8-9e93-fdd595ec583e_ttr2zh.avif';
        }else if(color == 'black'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730554174/black_q0cwba.png';
        }else if(color == 'blue'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730561154/blue_vep21i.png';
        }else if(color == 'green'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730561154/green_bx8ypb.png';
        }
        res.render("design",{tshirtImageUrl});
    } catch (error) {
    }
}

const saveDesign = async(req,res)=> {
    try {
        const { image } = req.body;
        
        const userData = await User.findOne({email  : req.session.user});
        
        const result = await cloudinary.uploader.upload(image , {
            folder : 'tshirt-design'
        });

        const newDesign = new Design({
            image : result.secure_url,
            userId : userData._id,
        })

        const save = await newDesign.save();
        if(save){
            res.json({success : true});
        }else {
            res.json({success : false});
        }
    } catch (error) {
        res.json({success : false});
    }
}

const getDesign = async(req,res)=> {
    try {
        const userData = await User.findOne({email  : req.session.user});
        const designs = await Design.find({userId : userData._id});
        res.render("mydesign",{designs : designs})
    } catch (error) {
    }
}

const getCheckout = async(req,res)=> {
    try {
        const {designId} = req.query;
        const userData = await User.findOne({email  : req.session.user});
        const design = await Design.findById(designId);
        const wallet = await Wallet.findOne({userId : userData._id});
        res.render("customCheckout",{address : userData.addresses , item : design , user : userData , wallet : wallet.balance});
    } catch (error) {
    }
}

const deleteDesign = async(req,res)=> {
    try {
        const {id} = req.body;
        const result = await Design.findByIdAndDelete(id);
        if(result){
            res.json({success : true});
        }else {
            res.json({success : false});
        }
    } catch (error) {
        res.status(500).json({success : false});
    }
}

const checkout = async(req,res)=> {
    try {
        const {selectedAddress , image , paymentMethod , designId} = req.body;
        const userData = await User.findOne({email : req.session.user});
        const addressId = new ObjectId(selectedAddress);
        const wallet = await Wallet.findOne({userId : userData._id}); 


        // address
        const address = await User.aggregate([
            {
              $unwind: "$addresses",
            },
            {
              $match: {
                "addresses._id": addressId,
              },
            },
        ]);
        const shippAddress = address[0].addresses;
     

        // creating order
        const newOrder = new customOrder({
            userId : userData._id,
            shippingAddress : shippAddress,
            design : image,
            totalAmount : 1499,
            paymentMethod : 'Wallet',
        });
        const result = await newOrder.save();


        //  decreasing balance in wallet
        const newBalance = wallet.balance - 1499;
        await Wallet.updateOne({userId : userData._id} , {$set : {balance : newBalance}});


        // adding transaction history to wallet 
        const transaction = {
            orderId: result._id,
            amount: 1499,
            description: 'CustomOrder',
            transactionType: 'debit',
            paymentMethod: 'Wallet',
        };

        wallet.transactions.push(transaction);
        await wallet.save();

        // deleting the design from user design collection
        const deleteDesign = await Design.findByIdAndDelete(designId);
        res.redirect(`/user/custom_order/${result._id}`);
    } catch (error) {
    }
}

const orderSuccess = async(req,res)=> {
    try {
        const {id} = req.params;
        const order = await customOrder.findById(id);
        res.render("customOrderSuccess",{order : order});
    } catch (error) {
    }
}
module.exports = {
    loadCustomPage,
    designPage,
    saveDesign,
    getDesign,
    getCheckout,
    deleteDesign,
    checkout,
    orderSuccess
}