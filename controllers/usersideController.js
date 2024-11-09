const bcrypt = require("bcrypt");
const productModel = require("../models/product");
const userModel = require("../models/user");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const wishlistModel = require("../models/wishlist");
const categoryModel = require("../models/category");
const CouponModel = require("../models/couponModel");
const couponModel = require("../models/couponModel");
const walletModel = require("../models/wallet");
const Razorpay = require("razorpay");
const { ObjectId } = require("mongoose").Types;
const PDFDocument = require("pdfkit");

// Razor pay configuration
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});


const productView = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/user/login");
    } else {
      const productId = req.params.id;
      const user = req.session.user;
      const userData = await userModel.findOne({ email: user });
      const productData = await productModel
        .findById(productId)
        .populate("category", "name");
      res.render("productView", { product: productData, user: userData });
    }
  } catch (error) {
    console.log("error in the product View", error.message);
  }
};
// loading shop list
const shopList = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/user/login");
    } else {
      const user = req.session.user;
      const userData = await userModel.findOne({ email: user });

      const { category, sort, search, page = 1 } = req.query;

      console.log(req.query);
      const limit = 8;
      const skip = (page - 1) * limit;

      let query = { isListed: true };

      if (category && category !== "All Categories") {
        query["category"] = category;
      }

      if (search) {
        query.productName = { $regex: search, $options: "i" };
      }
      console.log(query);

      const totalProducts = await productModel.countDocuments(query);

      let productData = await productModel
        .find(query)
        .populate("category")
        .skip(skip)
        .limit(limit);

      if (sort) {
        switch (sort) {
          case "price-low-high":
            productData.sort((a, b) => a.salesPrice - b.salesPrice);
            break;
          case "price-high-low":
            productData.sort((a, b) => b.salesPrice - a.salesPrice);
            break;
          case "name-az":
            productData.sort((a, b) =>
              a.productName.localeCompare(b.productName)
            );
            break;
          case "name-za":
            productData.sort((a, b) =>
              b.productName.localeCompare(a.productName)
            );
            break;
        }
      }

      const categories = await categoryModel.find({}, { name: 1 });

      const totalPages = Math.ceil(totalProducts / limit);
      const currentPage = parseInt(page);

      res.render("shopPage", {
        user: userData,
        products: productData,
        categories,
        currentCategory: query.category || "All Categories",
        currentSort: sort || "default",
        searchQuery: search || "",
        pagination: {
          totalProducts,
          currentPage,
          totalPages,
          limit,
        },
      });
    }
  } catch (error) {
    console.log("error while loading shop page", error.message);
    res.status(500).send("An error occurred while loading the shop page");
  }
};

// user profile page load
const userProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await userModel.findOne({ email: userId });
    res.render("userDetails", { userData: userData });
  } catch (error) {
    console.log("error while loading page", error.message);
  }
};
// updating user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone } = req.body;
    console.log(userId, name, phone);
    const userExist = await userModel.findOne({ name });
    if (userExist) {
      res.json({ success: false });
    } else {
      const result = await userModel.findByIdAndUpdate(userId, {
        username: name,
        phone: phone,
      });
      console.log(result);
      res.json({ success: true });
    }
  } catch (error) {
    console.log("error while updating the user profile", error.message);
    res.json({ error: true });
  }
};


// ---- changing password of user ----
// loading change password page
const passwordPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await userModel.findOne({ email: userId });
    res.render("password", { userData: userData });
  } catch (error) {
    console.log(error.message);
  }
};
// post request for changing pass
const changePass = async (req, res) => {
  try {
    const { oldPass, newPass, userId } = req.body;
    console.log(oldPass, newPass, userId);
    const userData = await userModel.findById(userId);
    console.log(userData);
    const isMatch = await bcrypt.compare(oldPass, userData.password);
    if (!isMatch) {
      res.json({ success: false });
    } else {
      const hashPass = await bcrypt.hash(newPass, 10);
      await userModel.findByIdAndUpdate(userId, {
        password: hashPass,
      });
      res.json({ success: true });
    }
    console.log(isMatch);
  } catch (error) {
    console.log("error while upating password", error.message);
    res.json({ success: false });
  }
};

//  address page
const addPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await userModel.findOne({ email: userId });
    const addressData = user.addresses;
    res.render("address", { userData: user, address: addressData });
  } catch (error) {
    console.log("error while loading address page", error.message);
  }
};

// adding address
const addAddress = async (req, res) => {
  try {
    const userEmail = req.session.user;
    const user = await userModel.findOne({ email: userEmail });
    console.log(req.body);
    const { name, house, street, city, state, pincode, phone, altPhone } =
      req.body;

    const addressFound = await userModel.findOne({
      email: userEmail,
      "addresses.fullName": name,
    });
    if (!addressFound) {
      const newAddress = {
        fullName: name,
        phone: phone,
        street: street,
        city: city,
        state: state,
        pincode: pincode,
        altPhone: altPhone,
        house: house,
      };

      user.addresses.push(newAddress);
      const userData = await user.save();
      const latestAddress = userData.addresses[userData.addresses.length - 1];
      if (userData) {
        res.status(200).json({ success: true, address: latestAddress });
      }
    } else {
      res.status(200).json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "server error" });
  }
};

// delete address
const deleteAdd = async (req, res) => {
  try {
    const addId = req.body.addId;
    const addressId = new ObjectId(addId);
    const deleted = await userModel.findOneAndUpdate(
      { email: req.session.user },
      { $pull: { addresses: { _id: addressId } } }
    );
    if (deleted) {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false, message: "Address not found" });
    }
  } catch (error) {
    console.log("error while deleting address", error.message);
    res.status(500).json({ error: "an error occured while deleting address" });
  }
};

// edit address
const editAddPage = async (req, res) => {
  try {
    const addressId = new ObjectId(req.params.id);
    const userData = await userModel.findOne({ email: req.session.user });
    const address = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addressId,
        },
      },
    ]);
    res.render("editAdd", { address: address[0].addresses });
  } catch (error) {
    console.log("error while editing Address", error.message);
  }
};

const updateEditAdd = async (req, res) => {
  try {
    const { id } = req.params;
    const addId = new ObjectId(id);
    const { name, house, street, city, state, pincode, phone, altPhone } =
      req.body;

    const addressData = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addId,
        },
      },
      {
        $project: {
          addresses: 1,
        },
      },
    ]);

    const addressUpdate = await userModel.updateOne(
      {
        email: req.session.user,
        "addresses._id": addId,
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
          "addresses.$.altPhone": altPhone,
        },
      }
    );

    if (addressUpdate.modifiedCount > 0) {
      req.flash("error", "Address updated successfully");
      res.redirect("/user/address");
    } else {
      req.flash("error", "Updatin Address failed , please try again later");
    }
  } catch (error) {
    req.flash(
      "error",
      "An error occured while updating Address , please try again later"
    );
    res.redirect("/user/address");
  }
};

// cart
const addCart = async (req, res) => {
  try {
    const email = req.session.user;
    const userData = await userModel.findOne({ email });
    console.log(userData);
    console.log(req.body);

    const { categoryId, productId, size, quantity } = req.body;


    const maxLimit = 5;

    // checkint if the cart already exists
    const cartExists = await cartModel.findOne({
      userId: userData._id,
      productId: productId,
      "sizes.size": size,
    });

    const productData = await productModel.findById(productId);
    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    // Find the size stock of the product
    const productSize = productData.sizes.find((item) => item.size === size);
    if (!productSize) {
      return res
        .status(404)
        .json({ success: false, message: "Product size not found." });
    }

    const stockAvailable = productSize.stock;
    console.log(`Available stock for size ${size}:`, stockAvailable);

    if (cartExists) {
      // If the cart item exists
      const currentQuantityInCart = cartExists.sizes.find(
        (item) => item.size === size
      ).quantity;
      console.log(
        `Current quantity in cart for size ${size}:`,
        currentQuantityInCart
      );

      const totalQuantity = currentQuantityInCart + Number(quantity);

      // Check if adding the new quantity exceeds the stock or user limit
      if (totalQuantity > stockAvailable) {
        return res.json({
          success: false,
          message: `Stock limit reached`,
        });
      }
      
      if (totalQuantity > maxLimit) {
        return res.json({
          success: false,
          message: `Cannot add more than ${maxLimit} items of this product.`,
        });
      }

      // Update the cart with the new quantity
      await cartModel.updateOne(
        {
          userId: userData._id,
          productId: productId,
          "sizes.size": size,
        },
        { $inc: { "sizes.$.quantity": Number(quantity) } }
      );

      res.json({ success: true });
    } else {
      // Check if the quantity exceeds the max limit when adding a new cart item
      if (quantity > maxLimit) {
        return res.json({
          success: false,
          message: `Cannot add more than ${maxLimit} items of this product.`,
        });
      }

      const items = [
        {
          size: size,
          quantity: quantity,
        },
      ];

      const newCart = new cartModel({
        userId: userData._id,
        productId: productId,
        categoryId: categoryId,
        sizes: items,
      });

      await newCart.save();
      res.json({ success: true });
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
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }

    // Fetch the user details
    const userDetails = await userModel.findOne({ email });
    if (!userDetails) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Fetch the user's cart and populate product and category details
    const cartDetails = await cartModel
      .find({ userId: userDetails._id })
      .populate({
        path: "productId",
        select:
          "productName salesPrice images sizes salesPriceAfterDiscount offerStatus productOffer",
      })
      .populate("categoryId");

    // Map through cart items and attach available stock for each size
    const updatedCartDetails = cartDetails.map((item) => {
      const cartItem = item.toObject(); // Convert Mongoose document to plain JS object
      const sizeInCart = cartItem.sizes[0].size;

      // Find the corresponding size object in the product's size array
      const sizeObject = cartItem.productId.sizes.find(
        (size) => size.size === sizeInCart
      );

      // If size found, attach stock, otherwise set stock to 0
      cartItem.availableStock = sizeObject ? sizeObject.stock : 0;

      return cartItem;
    });

    // Render the cart page with updated cart details
    res.render("cart", { cart: updatedCartDetails, user: userDetails });
  } catch (error) {
    // Log error for server debugging
    console.error("Error loading cart:", error.message);

    // Respond with an internal server error
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCart = async (req, res) => {
  try {
    const cartId = req.params.id;
    const result = await cartModel.findByIdAndDelete(cartId);
    if (result) {
      res.redirect("/user/cart");
    }
  } catch (error) {
    console.log("error while deleting cart");
  }
};

// wishList
const wishListPage = async (req, res) => {
  try {
    // Find the user based on the session
    const userData = await userModel.findOne({ email: req.session.user });
    const userId = userData._id;

    // Find the wishlist for the user and populate the productId
    const wishListData = await wishlistModel
      .findOne({ userId: userId })
      .populate({
        path: "products.productId",
        model: "Products",
      });

    // Render the wishlist page with the user and populated wishlist data
    res.render("wishlist", { user: userData, wishlist: wishListData });
  } catch (error) {
    console.log("Error in wishListPage:", error.message);
    res.status(500).send("Server error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userData = await userModel.findOne({ email: req.session.user });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { productId } = req.body;

    const wishlist = await wishlistModel.findOne({ userId: userData._id });

    if (wishlist) {
      // Check if the product already exists in the wishlist
      const productExists = wishlist.products.some(
        (product) => product.productId.toString() === productId
      );

      if (productExists) {
        return res
          .status(200)
          .json({
            success: false,
            message: "Product already exists in wishlist",
          });
      }

      // Add the new product to the existing wishlist
      wishlist.products.push({ productId });
      await wishlist.save();
    } else {
      const newWishlist = new wishlistModel({
        userId: userData._id,
        products: [{ productId }],
      });
      await newWishlist.save();
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Product added to wishlist successfully",
      });
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await userModel.findOne({ email: req.session.user });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    const result = await wishlistModel.updateOne(
      { userId: userData._id },
      { $pull: { products: { productId: id } } }
    );

    if (result.nModified === 0) {
      return res.status(400).send("Product not found in wishlist");
    }

    res.redirect("/user/wishlist");
  } catch (error) {
    console.log("Error from removeWishlist:", error.message);
    res.status(500).send("Internal Server Error");
  }
};


// checkout
const checkoutPage = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email });
    coupons = await couponModel.find({});
    const wallet = await walletModel.findOne({userId : user._id}); 
    const cartDetails = await cartModel
      .find({ userId: user._id })
      .populate("productId")
      .populate("categoryId");
    res.render("checkout", {
      cart: cartDetails,
      address: user.addresses,
      user: user,
      coupons : coupons,
      wallet : wallet.balance,
    });
  } catch (error) {
    console.log("error while loading checkout page", error.message);
  }
};

// cash on delivery (COD)
const checkout = async (req, res) => {
  try {
    const email = req.session.user;
    const userData = await userModel.findOne({ email });
    const { selectedAddress, cartItems, couponCode, paymentMethod } = req.body;
    const addressId = new ObjectId(selectedAddress);

    // Selecting Address
    const address = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addressId,
        },
      },
    ]);

    let totalPrice = 0;
    let totalDiscount = 0;

    // Calculate Total Amount and Total Discount
    for (const item of cartItems) {
      const itemProductId = item.productId;
      const product = await productModel.findById(itemProductId);

      const itemTotal = product.salesPriceAfterDiscount
        ? product.salesPriceAfterDiscount * item.quantity
        : product.salesPrice * item.quantity;
      totalPrice += itemTotal;

      // Calculate the product discount based on quantity
      if (product.productOffer.length > 0 && product.productOffer[0].discountAmount) {
        totalDiscount += product.productOffer[0].discountAmount * item.quantity;
      }
    }

    // Applying coupon discount
    let discount = 0;
    if (couponCode) {
      const coupon = await couponModel.findOne({ name: couponCode });
      discount = Math.round((totalPrice * coupon.discountPercentage) / 100);
      totalPrice -= discount;
    }

    const order = new orderModel({
      userId: userData._id,
      products: cartItems,
      shippingAddress: address[0].addresses,
      paymentMethod: paymentMethod,
      totalAmount: totalPrice,
      coupon: couponCode,
      couponDiscount: discount,
      backupTotalAmount: totalPrice + discount, // Original price before coupon
      discount: totalDiscount,
    });
    const orderDetails = await order.save();

    // Decreasing wallet amount
    if (paymentMethod === 'Wallet') {
      const wallet = await walletModel.findOne({ userId: userData._id });
      wallet.balance -= totalPrice;

      const newTransaction = {
        orderId: orderDetails._id,
        amount: totalPrice,
        description: 'Wallet Order',
        transactionType: 'debit',
        paymentMethod: 'Wallet',
      };

      wallet.transactions.push(newTransaction);
      await wallet.save();
    }

    // Decreasing stock quantity
    for (let product of cartItems) {
      const productId = product.productId;
      await productModel.updateOne(
        { _id: productId, "sizes.size": product.size },
        { $inc: { "sizes.$.stock": -product.quantity } }
      );
    }

    // Deleting cart items
    await cartModel.deleteMany({ userId: userData._id });
    res.redirect(`/user/order/${orderDetails._id}`);
  } catch (error) {
    console.log("Error during checkout:", error.message);
  }
};


// order success page
const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    const order = await orderModel
      .findById(orderId)
      .populate("products.productId")
      .populate("shippingAddress");

      if(order.status == 'Pending'){
        res.render("orderPage", { order });
      }else {
        res.render("paymentFail",{order});
      }
  } catch (error) {
    console.log("error while loading order confirmation page", error.message);
  }
};

// updating cart quantity
const updateCartQuantity = async (req, res) => {
  try {
    const { size, action, cartItemId } = req.body;

    const cartItem = await cartModel.findById(cartItemId).populate("productId");
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    const productSize = cartItem.productId.sizes.find((s) => s.size === size);
    if (!productSize) {
      return res.status(400).json({ success: false, message: "Invalid size" });
    }

    const cartSize = cartItem.sizes.find((s) => s.size === size);

    if (action === "increase") {
      if(cartSize.quantity >= 5 ){
        return res.json({success: false , message : 'limit reached'});
      }
      if (cartSize.quantity < productSize.stock) {
        cartSize.quantity += 1;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Stock limit reached." });
      }
    } else if (action === "decrease") {
      if (cartSize.quantity > 1) {
        cartSize.quantity -= 1;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Quantity cannot be less than 1." });
      }
    }

    await cartItem.save();
    return res.json({ success: true, message: "Cart updated successfully." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// online order
const onlineOrder = async (req, res) => {
  try {
    console.log(req.body);
    const userData = await userModel.findOne({ email: req.session.user });
    console.log(userData);
    const { selectedAddress, cartItems, couponCode, paymentMethod } = req.body;
    const addressId = new ObjectId(selectedAddress);
    const address = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addressId,
        },
      },
    ]);

    let totalPrice = 0;

    for (const item of cartItems) {
      const itemProductId = item.productId;
      const product = await productModel.findById(itemProductId);
      const itemTotal = product.salesPriceAfterDiscount
        ? product.salesPriceAfterDiscount * item.quantity
        : product.salesPrice * item.quantity;
      totalPrice += itemTotal;
    }

    if (couponCode) {
      const couponData = await couponModel.findOne({ name: couponCode });
      const discountPercentage = couponData.discountPercentage;
      totalPrice -= Math.round((totalPrice / 100) * discountPercentage);
    }
    console.log(`total after cupon discount : ${totalPrice}`);
    const amount = totalPrice * 100;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
        });
      } else {
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log("error while creating online order", error.message);
  }
};

// after payment successfull
const verifyOrder = async (req, res) => {
  try {
    const userData = await userModel.findOne({ email: req.session.user });
    const { selectedAddress, cartItems, couponCode, paymentMethod } = req.body;
    const addressId = new ObjectId(req.body.selectedAddress);
    const address = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addressId,
        },
      },
    ]);

    let totalPrice = 0;

    let totalDiscount = 0;

    for (const item of cartItems) {
      const itemProductId = item.productId;
      const product = await productModel.findById(itemProductId);
      const itemTotal = product.salesPriceAfterDiscount
        ? product.salesPriceAfterDiscount * item.quantity
        : product.salesPrice * item.quantity;
      totalPrice += itemTotal;

      if(product.productOffer.length > 0 && product.productOffer[0].discountAmount) {
        totalDiscount += product.productOffer[0].discountAmount;
      }
    }

    let discount = 0;
    if (couponCode) {
      const couponData = await couponModel.findOne({ name: couponCode });
      const discountPercentage = couponData.discountPercentage;
      discount = Math.round((totalPrice / 100) * discountPercentage);
      totalPrice -= discount;
    }
    console.log(`total after cupon discount : ${totalPrice}`);

    // creating order and saving database
    const order = new orderModel({
      userId: userData._id,
      products: cartItems,
      shippingAddress: address[0].addresses,
      paymentMethod: "Razorpay",
      totalAmount: totalPrice,
      coupon : couponCode,
      couponDiscount: discount,
      backupTotalAmount : totalPrice,
      discount : totalDiscount,
    });
    const orderDetails = await order.save();

    for (let product of cartItems) {
      const productId = product.productId;
      const updateProduct = await productModel.updateOne(
        { _id: productId, "sizes.size": product.size },
        { $inc: { "sizes.$.stock": -product.quantity } }
      );
    }

    const cartDelete = await cartModel.deleteMany({ userId: userData._id });
    console.log(cartDelete);
    if (orderDetails && cartDelete) {
      res.json({ success: true, orderId: orderDetails._id });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log("error while creating order", error.message);
  }
};

// orders
const ordersPage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await userModel.findOne({ email: user });
    const orders = await orderModel
      .find({ userId: userData._id })
      .sort({ createdAt: -1 });
    res.render("orders", { orders, userData: userData });
  } catch (error) {
    console.log("error while loading orders page", error.message);
  }
};
// View order Details
const viewOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user;
    const userData = await userModel.findOne({ email: userId });
    const order = await orderModel
      .findById(id)
      .populate("products.productId")
      .populate("shippingAddress");
    if (String(userData._id) != String(order.userId)) {
      res.redirect("/user/orders");
    } else {
      const user = userData;
      const address = order.shippingAddress;
      const products = order.products;
      res.render("orderDetails", { order, user, address, products });
    }
  } catch (error) {
    console.log("error while loading view order page", error.message);
  }
};
// Cancelling Order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.body;
    console.log("Cancelling order with ID:", id);

    const order = await orderModel.findById(id).populate('userId');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    
    let refundAmount = 0;
    for (const product of order.products) {
      if (product.status !== "Cancelled") {
        let productRefundAmount = product.price * product.quantity;


        if (order.coupon) {
          const coupon = await couponModel.findOne({ name: order.coupon });
          if (coupon) {
            const discountMultiplier = 1 - (coupon.discountPercentage / 100);
            productRefundAmount *= discountMultiplier; 
          }
        }
        refundAmount += productRefundAmount;


        await productModel.updateOne(
          { _id: product.productId, "sizes.size": product.size },
          { $inc: { "sizes.$.stock": product.quantity } }
        );


        await orderModel.updateOne(
          { _id: id, "products._id": product._id },
          { $set: { "products.$.status": "Cancelled" } }
        );
      }
    }


    refundAmount = Math.round(refundAmount);

    if (order.paymentMethod === "Razorpay" && refundAmount > 0) {
      // Set totalAmount to 0 for Razorpay orders
      await orderModel.updateOne({ _id: id }, { $set: { totalAmount: 0 } });

      // Update wallet
      const walletData = await walletModel.findOne({ userId: order.userId._id });
      if (walletData) {
        walletData.balance += refundAmount;


        const transaction = {
          orderId: id,
          amount: refundAmount,
          description: 'Cancelled',
          transactionType: 'credit',
          paymentMethod: order.paymentMethod,
        };
        walletData.transactions.push(transaction);
        await walletData.save();
      }
    }

    // Update the order status to "Cancelled"
    await orderModel.findByIdAndUpdate(id, { $set: { status: "Cancelled" } });

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.log("Error while cancelling order:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// return order
const returnOrder = async (req, res) => {
  try {
    const { id } = req.body;
    console.log("Returning entire order with ID:", id);

    const order = await orderModel.findById(id).populate('userId');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    let refundAmount = 0;

    for (const product of order.products) {
      if (product.status !== "Returned") {
        let productRefundAmount = product.price * product.quantity;

        // Apply coupon discount if applicable
        if (order.coupon) {
          const coupon = await couponModel.findOne({ name: order.coupon });
          if (coupon) {
            const discountMultiplier = 1 - (coupon.discountPercentage / 100);
            productRefundAmount *= discountMultiplier;
          }
        }

        refundAmount += productRefundAmount;

        // Restock the returned product
        await productModel.updateOne(
          { _id: product.productId, "sizes.size": product.size },
          { $inc: { "sizes.$.stock": product.quantity } }
        );

        // Update the product's status to "Returned"
        await orderModel.updateOne(
          { _id: id, "products._id": product._id },
          { $set: { "products.$.status": "Returned" } }
        );
      }
    }

    refundAmount = Math.round(refundAmount);

    // Update the order's totalAmount to zero and status to "Returned"
    await orderModel.updateOne(
      { _id: id },
      { $set: { totalAmount: 0, status: "Returned" } }
    );

    // Update the wallet balance and add transaction for both COD and Razorpay
    if (refundAmount > 0) {
      const walletData = await walletModel.findOne({ userId: order.userId._id });
      if (walletData) {
        walletData.balance += refundAmount;

        const transaction = {
          orderId: id,
          amount: refundAmount,
          description: 'Returned',
          transactionType: 'credit',
          paymentMethod: order.paymentMethod,
        };

        walletData.transactions.push(transaction);
        await walletData.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log("Error while returning entire order:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};







// cancel and reutrn for individual items
const cancelItem = async (req, res) => {
  try {
    console.log("cancelItem here !!");

    const userData = await userModel.findOne({ email: req.session.user });
    const { itemId, id } = req.body;
    const item = new ObjectId(itemId);
    const orderData = await orderModel.findById(id);

    // Find the canceled item
    const cancelItem = await orderModel.aggregate([
      { $unwind: "$products" },
      { $match: { "products._id": item } },
    ]);

    if (!cancelItem.length) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Restocking product quantity
    await productModel.updateOne(
      {
        _id: cancelItem[0].products.productId,
        "sizes.size": cancelItem[0].products.size,
      },
      {
        $inc: { "sizes.$.stock": cancelItem[0].products.quantity },
      }
    );

    // Changing status of the specific item
    await orderModel.updateOne(
      {
        _id: id,
        "products._id": itemId,
      },
      {
        $set: { "products.$.status": "Cancelled" },
      }
    );

    // Calculate subtotal for the canceled item (quantity * price)
    let subTotal = cancelItem[0].products.price * cancelItem[0].products.quantity;

    // Apply coupon discount if available
    if (orderData.coupon) {
      const couponData = await couponModel.findOne({ name: orderData.coupon });
      if (couponData) {
        const discountMultiplier = 1 - couponData.discountPercentage / 100;
        subTotal = Math.round(Number((subTotal * discountMultiplier).toFixed(2)));
      }
    }

    // Update totalAmount only if payment method is Razorpay
    if (orderData.paymentMethod === "Razorpay") {
      const newOrderTotal = Math.max(0, orderData.totalAmount - subTotal);
      await orderModel.updateOne(
        { _id: id },
        { $set: { totalAmount: newOrderTotal } }
      );

      // Update wallet balance and add transaction
      const walletData = await walletModel.findOne({ userId: userData._id });
      if (walletData) {
        walletData.balance += subTotal;

        const newTransaction = {
          orderId: id,
          amount: subTotal,
          description: 'Cancelled',
          transactionType: 'credit',
          paymentMethod: 'Razorpay',
        };

        walletData.transactions.push(newTransaction);
        await walletData.save();
      }
    }

    // Check if all products are cancelled and update order status
    const updatedOrder = await orderModel.findById(id);
    const allProductsCancelled = updatedOrder.products.every(
      (product) => product.status === "Cancelled"
    );
    if (allProductsCancelled) {
      await orderModel.updateOne(
        { _id: id },
        { $set: { status: "Cancelled" } }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while canceling item:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};



const returnItem = async (req, res) => {
  try {
    console.log("Return item here !!");

    const userData = await userModel.findOne({ email: req.session.user });
    const { itemId, id } = req.body;
    const item = new ObjectId(itemId);
    const orderData = await orderModel.findById(id);

    // Find the returned item
    const returnItem = await orderModel.aggregate([
      { $unwind: "$products" },
      { $match: { "products._id": item } },
    ]);

    if (!returnItem.length) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Restocking product quantity
    await productModel.updateOne(
      {
        _id: returnItem[0].products.productId,
        "sizes.size": returnItem[0].products.size,
      },
      {
        $inc: { "sizes.$.stock": returnItem[0].products.quantity },
      }
    );

    // Changing status of the specific item
    await orderModel.updateOne(
      {
        _id: id,
        "products._id": itemId,
      },
      {
        $set: { "products.$.status": "Returned" },
      }
    );

    // Check if all products are returned and update order status
    const updatedOrder = await orderModel.findById(id);
    const allProductsReturned = updatedOrder.products.every(
      product => product.status === "Returned"
    );

    if (allProductsReturned) {
      await orderModel.updateOne(
        { _id: id },
        { $set: { status: "Returned" } }
      );
    }

    // Calculate refund amount
    let refundAmount = returnItem[0].products.price * returnItem[0].products.quantity;

    // Apply coupon discount if available and calculate the amount !!
    if (orderData.coupon) {
      const couponData = await couponModel.findOne({ name: orderData.coupon });
      if (couponData) {
        const discountMultiplier = 1 - (couponData.discountPercentage / 100);
        refundAmount = Math.round(refundAmount * discountMultiplier);
      }
    }

    // updating the order toalAmount !!
      const newOrderTotal = Math.max(0,orderData.totalAmount - refundAmount);
        await orderModel.updateOne(
          {
            _id : id,
          },{
            $set : {totalAmount : newOrderTotal}
          }
        );

    // if it is razorpay or cod update the wallet because its return item !!
    if (orderData.paymentMethod === "Razorpay" || orderData.paymentMethod === "COD") {

      const walletData = await walletModel.findOne({ userId: userData._id });

      walletData.balance += refundAmount;


      const newTransaction = {
        orderId: id,
        amount: refundAmount,
        description: 'Returned',
        transactionType: 'credit',
        paymentMethod: orderData.paymentMethod,
      };

      walletData.transactions.push(newTransaction);
      await walletData.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while returning item:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};


// updating offer when the offer expires via ajax
const updateOffer = async (req, res) => {
  try {
    const { productId, offerId } = req.body;

    const result = await productModel.findOneAndUpdate(
      {
        _id: productId,
        "productOffer._id": offerId,
      },
      {
        $set: {
          "productOffer.$.offerStatus": false,
          salesPriceAfterDiscount: null,
        },
      }
    );
    console.log(result);
    res.json({ success: true });
  } catch (error) {
    console.log("error in update offer", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// validate coupon
const validateCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { couponCode, totalAmount } = req.body;
    const coupon = await CouponModel.findOne({ name: couponCode });

    if (!coupon) {
      return res.json({ valid: false, message: "Invalid coupon code." });
    }

    if (new Date() > coupon.expiryDate) {
      return res.json({ valid: false, message: "This coupon has expired." });
    }

    if (totalAmount < coupon.minPrice) {
      return res.json({
        valid: false,
        message: `This coupon is only valid for orders above ₹${coupon.minPrice}.`,
      });
    }

    res.json({
      valid: true,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.error("Error validating coupon:", error.message);
    res
      .status(500)
      .json({
        valid: false,
        message: "An error occurred while validating the coupon.",
      });
  }
};

// wallet page
const walletPage = async (req, res) => {
  try {
      const userData = await userModel.findOne({ email: req.session.user });

      const walletData = await walletModel.findOne({ userId: userData._id })
          .populate('transactions.orderId');

      walletData.transactions.sort((a, b) => b.createdAt - a.createdAt);

      res.render("wallet", { wallet: walletData });
  } catch (error) {
      console.log("Error in walletPage:", error.message);
      res.status(500).send("Error loading wallet page");
  }
};
  
// invoice generator
const downloadInvoice = async (req, res) => {
  try {
    const {id} = req.params;
    const order = await orderModel.findById(id);

    const doc = new PDFDocument();
    const filename = `order_invoice_${Date.now()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");
    
    doc.pipe(res);
    
    // Invoice Header
    doc.fontSize(20).text("Invoice", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`, { align: "center" });
    doc.fontSize(12).text(`Order Date: ${new Date(order.createdAt).toDateString()}`, { align: "center" });
    doc.moveDown();
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();
    
    // Customer Details
    doc.fontSize(14).text("Customer Details", { underline: true }).moveDown(0.5);
    doc.fontSize(12).text(`Customer Email: ${order.userId.email}`)
       .text(`Order Status: ${order.status}`)
       .moveDown();
    
    // Shipping Address
    doc.fontSize(14).text("Shipping Address", { underline: true }).moveDown(0.5);
    doc.fontSize(12)
       .text(`Name: ${order.shippingAddress.fullName}`)
       .text(`Mobile: ${order.shippingAddress.phone}`)
       .text(`Pincode: ${order.shippingAddress.pincode}`)
       .text(`City: ${order.shippingAddress.city}`)
       .text(`State: ${order.shippingAddress.state}`)
       .moveDown();
    
    // Order Items
    doc.fontSize(14).text("Order Items", { underline: true }).moveDown(0.5);
    order.products.forEach((item, index) => {
      doc.fontSize(12)
         .text(`Item ${index + 1}: ${item.productId.productName || "Product Name"}`)
         .text(`Quantity: ${item.quantity}`)
         .text(`Size: ${item.size}`)
         .text(`Price per Unit: ${item.price.toFixed(2)}`)
         .text(`Status: ${item.status || "N/A"}`)
         .text(`Total: ${(item.price * item.quantity).toFixed(2)}`)
         .moveDown();
    });
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();
    
    // Payment Details
    doc.fontSize(14).text("Payment Details", { underline: true }).moveDown(0.5);
    doc.fontSize(12)
       .text(`Payment Method: ${order.paymentMethod}`)
       .text(`Payment Status: ${order.paymentStatus || "N/A"}`)
       .text(`Payment ID: ${order.paymentId || "N/A"}`)
       .moveDown();
    
    // Pricing Summary
    doc.fontSize(14).text("Pricing Summary", { underline: true }).moveDown(0.5);
    doc.fontSize(12)
       .text(`Subtotal: ${order.totalAmount.toFixed(2)}`)
       .text(`Shipping Fee: ${order.shippingFee ? order.shippingFee.toFixed(2) : "0.00"}`)
       .text(`Discount: ${order.couponDiscount ? order.couponDiscount.toFixed(2) : "0.00"}`)
       .text(`Coupon Code: ${order.coupon || "N/A"}`)
       .moveDown();
    
    // Footer Note
    doc.fontSize(10).text("Thank you for your purchase!", { align: "center" }).moveDown();
    
    doc.end();    
  } catch (error) {
    console.error("Error in download Invoice:", error.message);
    res.status(500).json({ message: "An error occurred while generating the invoice" });
  }
};



// if the payment got failed
const paymentFailed  = async(req,res)=> {
  try {
    console.log("hi nigga ", req.body);
    const userData = await userModel.findOne({ email: req.session.user });
    const { selectedAddress, cartItems, couponCode, paymentMethod } = req.body;
    const addressId = new ObjectId(req.body.selectedAddress);
    const address = await userModel.aggregate([
      {
        $unwind: "$addresses",
      },
      {
        $match: {
          "addresses._id": addressId,
        },
      },
    ]);

    let totalPrice = 0;

    for (const item of cartItems) {
      const itemProductId = item.productId;
      const product = await productModel.findById(itemProductId);
      const itemTotal = product.salesPriceAfterDiscount
        ? product.salesPriceAfterDiscount * item.quantity
        : product.salesPrice * item.quantity;
      totalPrice += itemTotal;
    }

    let discount = 0;
    if (couponCode) {
      const couponData = await couponModel.findOne({ name: couponCode });
      const discountPercentage = couponData.discountPercentage;
      discount = Math.round((totalPrice / 100) * discountPercentage);
      totalPrice -= discount;
    }
    console.log(`total after cupon discount : ${totalPrice}`);

    // creating order for railed payment with  a status of 'Failed'
    const order = new orderModel({
      userId: userData._id,
      products: cartItems,
      shippingAddress: address[0].addresses,
      paymentMethod: "Razorpay",
      totalAmount: totalPrice,
      coupon : couponCode,
      couponDiscount: discount,
      backupTotalAmount : totalPrice,
      status : 'Failed'
    });
    const orderDetails = await order.save();

    if (orderDetails ) {
      res.json({ success: true, orderId: orderDetails._id });
    } else {
      res.json({ success: false });
    }
  }catch(error){
    console.log("error in paymentFailed",error.message);
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
  updateEditAdd,
  cancelItem,
  returnOrder,
  returnItem,
  onlineOrder,
  verifyOrder,
  wishListPage,
  addToWishlist,
  removeWishlist,
  updateOffer,
  validateCoupon,
  walletPage,
  downloadInvoice,
  paymentFailed
};