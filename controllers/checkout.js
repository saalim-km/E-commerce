const productModel = require("../models/product");
const userModel = require("../models/user");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const couponModel = require("../models/couponModel");
const walletModel = require("../models/wallet");
const Razorpay = require("razorpay");
const { ObjectId } = require("mongoose").Types;

// Razor pay configuration
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// checkout
const checkoutPage = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await userModel.findOne({ email });
    coupons = await couponModel.find({});
    const wallet = await walletModel.findOne({ userId: user._id });
    const cartDetails = await cartModel
      .find({ userId: user._id })
      .populate("productId")
      .populate("categoryId");
    res.render("checkout", {
      cart: cartDetails,
      address: user.addresses,
      user: user,
      coupons: coupons,
      wallet: wallet.balance,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
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
      if (
        product.productOffer.length > 0 &&
        product.productOffer[0].discountAmount
      ) {
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
    if (paymentMethod === "Wallet") {
      const wallet = await walletModel.findOne({ userId: userData._id });
      wallet.balance -= totalPrice;

      const newTransaction = {
        orderId: orderDetails._id,
        amount: totalPrice,
        description: "Wallet Order",
        transactionType: "debit",
        paymentMethod: "Wallet",
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
    console.log(error.message);
    res.status(500).render('500');
  }
};

// order success page
const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel
      .findById(orderId)
      .populate("products.productId")
      .populate("shippingAddress");

    if (order.status == "Pending") {
      res.render("orderPage", { order });
    } else {
      res.render("paymentFail", { order });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

// online order
const onlineOrder = async (req, res) => {
  try {
    const userData = await userModel.findOne({ email: req.session.user });
    const { selectedAddress, cartItems, couponCode, paymentMethod } = req.body;
    const addressId = new ObjectId(selectedAddress);

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
    console.log(error.message);
    res.status(500).render('500');
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

      if (
        product.productOffer.length > 0 &&
        product.productOffer[0].discountAmount
      ) {
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

    // creating order and saving database
    const order = new orderModel({
      userId: userData._id,
      products: cartItems,
      shippingAddress: address[0].addresses,
      paymentMethod: "Razorpay",
      totalAmount: totalPrice,
      coupon: couponCode,
      couponDiscount: discount,
      backupTotalAmount: totalPrice,
      discount: totalDiscount,
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
    if (orderDetails && cartDelete) {
      res.json({ success: true, orderId: orderDetails._id });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

// if the payment got failed
const paymentFailed = async (req, res) => {
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

    // creating order for railed payment with  a status of 'Failed'
    const order = new orderModel({
      userId: userData._id,
      products: cartItems,
      shippingAddress: address[0].addresses,
      paymentMethod: "Razorpay",
      totalAmount: totalPrice,
      coupon: couponCode,
      couponDiscount: discount,
      backupTotalAmount: totalPrice,
      status: "Failed",
    });
    const orderDetails = await order.save();

    if (orderDetails) {
      res.json({ success: true, orderId: orderDetails._id });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

module.exports = {
  checkoutPage,
  checkout,
  orderSuccess,
  onlineOrder,
  verifyOrder,
  paymentFailed
};
