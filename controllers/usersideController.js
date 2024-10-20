const bcrypt = require("bcrypt");
const productModel = require("../models/product");
const userModel = require("../models/user");
const addressModel = require("../models/address");
const categoryModel = require("../models/address");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const product = require("../models/product");
const { ObjectId } = require("mongoose").Types;

const productView = async(req,res)=> {
    try {
        if(!req.session.user){
            return res.redirect("/user/login");
        }else{
            const productId = req.params.id;
            const user = req.session.user;
            const userData = await userModel.findOne({ email: user });
            const productData = await productModel.findById(productId).populate("category","name");
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
        const userId = req.session.user;
        const userData = await userModel.findOne({email : userId});
        res.render("userDetails",{userData : userData});
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
        const userId = req.session.user;
        const userData = await userModel.findOne({email : userId});
        res.render("password",{userData : userData});
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
        const userId = req.session.user;
        const user = await userModel.findOne({email : userId});
        const addressData = user.addresses;
        res.render("address",{userData : user , address : addressData});
    } catch (error) {
        console.log("error while loading address page",error.message);
    }
}

// adding address
const addAddress = async(req,res)=> {
    try {
        const userEmail = req.session.user;
        const user = await userModel.findOne({email : userEmail});
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

        const addressFound = await userModel.findOne({email : userEmail , "addresses.fullName" : name});
        if(!addressFound) {
            const newAddress = {
                fullName : name,
                phone : phone,
                street : street,
                city : city,
                state : state,
                pincode : pincode,
                altPhone : altPhone,
                house : house,
            }

            user.addresses.push(newAddress)
            const userData = await user.save();
            const latestAddress = userData.addresses[userData.addresses.length-1];
            if(userData) {
                res.status(200).json({success : true , address : latestAddress});
            }
        }else {
            res.status(200).json({success : false});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error : "server error"});
    }
}

// delete address
const deleteAdd = async(req,res)=> {
    try {
        const addId = req.body.addId;
        const addressId = new ObjectId(addId);
        const deleted = await userModel.findOneAndUpdate({email : req.session.user} , {$pull : {"addresses" : {_id : addressId}}});
        if(deleted){
            res.status(200).json({success : true});
        }else { 
            res.status(200).json({success : false , message : "Address not found"});
        }
    } catch (error) {
        console.log("error while deleting address",error.message);
        res.status(500).json({error : "an error occured while deleting address"});
    }
}

const editAddPage = async(req,res)=> {
    try {
        const addressId = new ObjectId(req.params.id);
        const userData = await userModel.findOne({email : req.session.user});
        const address = await userModel.aggregate([
            {
                "$unwind" : "$addresses"
            },
            {
                "$match" : {
                    "addresses._id" : addressId
                }
            }
        ]);
        res.render("editAdd" , {address : address[0].addresses});
    } catch (error) {
        console.log("error while editing Address" , error.message);
    }
}

const updateEditAdd = async (req, res) => {
    try {
        const { id } = req.params;  
        const addId = new ObjectId(id);  
        const {
            name,
            house,
            street,
            city,
            state,
            pincode,
            phone,
            altPhone
        } = req.body;
        
        const addressData = await userModel.aggregate([
            {
                "$unwind": "$addresses"  
            },
            {
                "$match": {
                    "addresses._id": addId 
                }
            },
            {
                "$project": {
                    "addresses": 1  
                }
            }
        ]);

        const addressUpdate = await userModel.updateOne(
            {
                email: req.session.user,  
                "addresses._id": addId  
            },
            {
                $set: {
                    "addresses.$.fullName": name,
                    "addresses.$.house": house,
                    "addresses.$.street": street,
                    "addresses.$.city": city,
                    "addresses.$.state": state,
                    "addresses.$.pincode": pincode,
                    "addresses.$.phone": phone,
                    "addresses.$.altPhone": altPhone
                }
            }
        );

        if (addressUpdate.modifiedCount > 0) {
            req.flash("error" , "Address updated successfully")
            res.redirect("/user/address"); 
        } else {
            req.flash("error" , "Updatin Address failed , please try again later");
        }
    } catch (error) {
        req.flash("error" , "An error occured while updating Address , please try again later");
        res.redirect("/user/address");
    }
};



// cart 
const addCart = async(req, res) => {
    try {
      const email = req.session.user;
      const userData = await userModel.findOne({ email });
      console.log(userData);
      console.log(req.body);
  
      const { categoryId, productId, size, quantity } = req.body;
  
      // Find if the cart item already exists
      const cartExists = await cartModel.findOne({
        userId: userData._id,
        productId: productId,
        'sizes.size': size,
      });
  
      // Find the product to check stock availability
      const productData = await productModel.findById(productId);
      if (!productData) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }
  
      // Find the size stock of the product
      const productSize = productData.sizes.find(item => item.size === size);
      if (!productSize) {
        return res.status(404).json({ success: false, message: "Product size not found." });
      }
  
      const stockAvailable = productSize.stock;
      console.log(`Available stock for size ${size}:`, stockAvailable);
  
      if (cartExists) {
        // If the cart item exists, check the current quantity in the cart
        const currentQuantityInCart = cartExists.sizes.find(item => item.size === size).quantity;
        console.log(`Current quantity in cart for size ${size}:`, currentQuantityInCart);
  
        const totalQuantity = currentQuantityInCart + Number(quantity);
  
        // Check if adding the new quantity exceeds the available stock
        if (totalQuantity > stockAvailable) {
          return res.json({
            success: false,
            message: `stock limit reached`,
          });
        }
  
        // Update the cart with the new quantity
        const cartUpdate = await cartModel.updateOne(
          {
            userId: userData._id,
            productId: productId,
            'sizes.size': size
          },
          { $inc: { 'sizes.$.quantity': Number(quantity) } }
        );
  
        res.json({ success: true });
      } else {
  
        // Create a new cart entry
        const items = [
          {
            size: size,
            quantity: quantity
          }
        ];
  
        console.log(items);
  
        const newCart = new cartModel({
          userId: userData._id,
          productId: productId,
          categoryId: categoryId,
          sizes: items,
        });
  
        const result = await newCart.save();
        console.log(result);
  
        if (newCart) {
          res.json({ success: true, redirectUrl: `/user/cart` });
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
};
  
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
                select: 'productName salesPrice images sizes', // Select necessary fields
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
        const user = await userModel.findOne({email});
        const cartDetails = await cartModel.find({userId : user._id}).populate("productId").populate("categoryId");
        res.render("checkout",{cart : cartDetails , address : user.addresses , user: user});
    } catch (error) {
        console.log("error while loading checkout page",error.message);
    }
}

const checkout = async(req,res)=> {
    try {
        console.log(req.body);
        const email = req.session.user;
        const userData = await userModel.findOne({email});
        const {selectedAddress,cartItems,couponCode,paymentMethod} = req.body;
        console.log(selectedAddress)
        const addressId = new ObjectId(selectedAddress);
        const address = await userModel.aggregate([
            {
                "$unwind" : "$addresses"
            },
            {
                "$match" : {
                    "addresses._id" : addressId
                }
            }
        ]);
        console.log(cartItems);
        let totalPrice = 0;

        for(const item of cartItems){
            const itemProductId = item.productId;
            const product = await productModel.findById(itemProductId);
            const itemTotal = product.salesPrice * item.quantity;
            totalPrice += itemTotal;
        }
        const order = new orderModel({
            userId : userData._id,
            products : cartItems,
            shippingAddress : address[0].addresses,
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
        const user = req.session.user;
        const userData = await userModel.findOne({email : user});
        const orders = await orderModel.find({userId : userData._id}).sort({createdAt : -1});
        res.render("orders" , {orders , userData : userData});
    } catch (error) {
        console.log("error while loading orders page",error.message);
    }
}
// View order Details
const viewOrder = async(req,res)=> {
    try {
        const {id} = req.params;
        const userId = req.session.user;
        const userData = await userModel.findOne({email : userId});
        const order = await orderModel.findById(id).populate('products.productId').populate("shippingAddress");
        if(String(userData._id) != String(order.userId)){
            res.redirect("/user/orders");
        }else{
            const user = userData;
            const address = order.shippingAddress;
            const products = order.products;
            res.render('orderDetails',{order , user , address , products});
        }
    } catch (error) {
        console.log("error while loading view order page",error.message);
    }
}
// Cancelling Order
const cancelOrder = async(req,res)=> {
    try {
        const {id} = req.body;
        console.log(id);
        const order = await orderModel.findById(id); 
        const orderUpdate = await orderModel.findByIdAndUpdate(id,{$set : {status : 'Cancelled'}});
        console.log(orderUpdate)

        if(orderUpdate) {
            for(const product of order.products){
                const productId = product.productId;
                const size = product.size;
                const quantity = product.quantity;

                await productModel.updateOne(
                    {
                        _id : productId,
                        'sizes.size' : size
                    },
                    {
                        $inc : {'sizes.$.stock' : quantity}
                    }
                );
            }

            res.json({success : true});
        }else {
            res.json({success : false});   
        }
    } catch (error) {
        console.log("error while updating order status",error.message);
        res.status(500).json({success : false});
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
    cancelOrder,
    editAddPage,
    updateEditAdd
}