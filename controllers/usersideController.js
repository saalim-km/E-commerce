const bcrypt = require("bcrypt");
const productModel = require("../models/product");
const userModel = require("../models/user");
const addressModel = require("../models/address");
const categoryModel = require("../models/address");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");

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
        const existingAdderess = await addressModel.findOne({fullName : name , userId : userData._id});
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

// cart 
const addCart = async(req,res)=> {
    try {
        const email = req.session.user;
        const userData = await userModel.findOne({email});
        console.log(userData);
        console.log(req.body);
        const {categoryId,productId,size ,quantity} = req.body;
        const cartExists = await cartModel.findOne({
            userId : userData._id,
            productId : productId,
            'sizes.size' : size,
        });
        console.log(cartExists);
        // checking if the cart exists
        if(cartExists){
            const cartUpdate = await cartModel.updateOne(
                {
                    userId : userData._id,
                    productId : productId,
                    'sizes.size' : size
                },
                {$inc : {'sizes.$.quantity' : Number(quantity)}}
            );
            res.json({success : true});
        }else{
            const items = [
                {
                    size : size,
                    quantity : quantity
                }
            ]
            console.log(items);
            const newCart = new cartModel({
                userId : userData._id,
                productId : productId,
                categoryId : categoryId,
                sizes : items,
            })
            const result = await newCart.save();
            console.log(result);
            if(newCart){
                res.json({success : true , redirectUrl : `/user/cart`});
            }
        }
    } catch (error) {
        res.status(500).json({success : false});
    }
}

const loadCart = async (req, res) => {
    try {
        // Check if the user is logged in
        const email = req.session.user;
        if (!email) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        // Fetch the user details
        const userDetails = await userModel.findOne({ email });
        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch the user's cart and populate product and category details
        const cartDetails = await cartModel
            .find({ userId: userDetails._id })
            .populate({
                path: 'productId',
                select: 'productName regularPrice images sizes', // Select necessary fields
            })
            .populate('categoryId');

        // Map through cart items and attach available stock for each size
        const updatedCartDetails = cartDetails.map((item) => {
            const cartItem = item.toObject(); // Convert Mongoose document to plain JS object
            const sizeInCart = cartItem.sizes[0].size;

            // Find the corresponding size object in the product's size array
            const sizeObject = cartItem.productId.sizes.find(size => size.size === sizeInCart);

            // If size found, attach stock, otherwise set stock to 0
            cartItem.availableStock = sizeObject ? sizeObject.stock : 0;
            
            return cartItem;
        });

        // Render the cart page with updated cart details
        res.render('cart', { cart: updatedCartDetails, user: userDetails });

    } catch (error) {
        // Log error for server debugging
        console.error('Error loading cart:', error.message);
        
        // Respond with an internal server error
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const deleteCart = async(req,res)=> {
    try {
        const cartId = req.params.id;
        const result = await cartModel.findByIdAndDelete(cartId);
        if(result){
            res.redirect("/user/cart");
        }
    } catch (error) {
        console.log("error while deleting cart")
    }
}


// checkout
const checkoutPage = async(req,res)=> {
    try {
        const email = req.session.user;
        const userDetails = await userModel.findOne({email});
        const userAddress = await addressModel.find({userId : userDetails._id});
        const cartDetails = await cartModel.find({userId : userDetails._id}).populate("productId").populate("categoryId");
        res.render("checkout",{cart : cartDetails , address : userAddress , user: userDetails});
    } catch (error) {
        console.log("error while loading checkout page",error.message);
    }
}
const checkout = async(req,res)=> {
    try {
        console.log(req.body);
        const email = req.session.user;
        const userData = await userModel.findOne({email});
        console.log(userData._id);
        const {selectedAddress,cartItems,couponCode,paymentMethod} = req.body;
        console.log(cartItems);
        let totalPrice = 0;

        for(const item of cartItems){
            const itemProductId = item.productId;
            const product = await productModel.findById(itemProductId);
            const itemTotal = product.regularPrice * item.quantity;
            totalPrice += itemTotal;
        }
        const order = new orderModel({
            userId : userData._id,
            products : cartItems,
            shippingAddress : selectedAddress,
            paymentMethod : paymentMethod,
            totalAmount : totalPrice,
        });
        const orderDetails = await order.save();

        for(let product of cartItems){
            console.log(product);
            const productId = product.productId;
            const updateProduct = await productModel.updateOne({_id:productId ,'sizes.size' : product.size},{$inc : {'sizes.$.stock' : -product.quantity}});
        }

        const cartDelete = await cartModel.deleteMany({userId : userData._id});
        console.log(cartDelete);
        res.redirect(`/user/order/${orderDetails._id}`);
    } catch (error) {
        console.log("error while checkout",error.message)
    }
}

const orderSuccess = async(req,res)=> {
    try {
        const orderId = req.params.id;
        const order = await orderModel.findById(orderId).populate("products.productId").populate("shippingAddress");
        res.render("orderPage",{order});
    } catch (error) {
        console.log("error while loading order confirmation page",error.message)
    }
}
const updateCartQuantity = async (req, res) => {
    try {
        const { size, action , cartItemId} = req.body;
        console.log(cartItemId)

        const cartItem = await cartModel.findById(cartItemId).populate('productId');
        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }

        const productSize = cartItem.productId.sizes.find(s => s.size === size);
        if (!productSize) {
            return res.status(400).json({ success: false, message: "Invalid size" });
        }

        const cartSize = cartItem.sizes.find(s => s.size === size);

        if (action === 'increase') {
            if (cartSize.quantity < productSize.stock) {
                cartSize.quantity += 1;
            } else {
                return res.status(400).json({ success: false, message: "Stock limit reached." });
            }
        } else if (action === 'decrease') {
            if (cartSize.quantity > 1) {
                cartSize.quantity -= 1;
            } else {
                return res.status(400).json({ success: false, message: "Quantity cannot be less than 1." });
            }
        }

        await cartItem.save();
        return res.json({ success: true, message: "Cart updated successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


// orders
const ordersPage = async(req,res)=> {
    try {
        const {id} = req.params;
        const userData = await userModel.findById(id);
        const orders = await orderModel.find({userId : userData._id});
        res.render("orders" , {orders , userData : userData});
    } catch (error) {
        console.log("error while loading orders page",error.message);
    }
}

const viewOrder = async(req,res)=> {
    try {
        const {id} = req.params;
        const order = await orderModel.findById(id).populate('products.productId').populate("userId").populate("shippingAddress");

        const user = order.userId;
        const address = order.shippingAddress;
        const products = order.products;
        res.render('orderDetail',{order , user , address , products});
    } catch (error) {
        console.log("error while loading view order page",error.message);
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
    addCart,
    loadCart,
    deleteCart,
    checkoutPage,
    checkout,
    orderSuccess,
    updateCartQuantity,
    ordersPage,
    viewOrder,
}