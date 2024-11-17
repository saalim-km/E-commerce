const productModel = require("../models/product");
const userModel = require("../models/user");
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
    console.log(error.message);
    res.status(500).render('500');
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
    console.log(error.message);
    res.status(500).render('500');
  }
};

// Cancelling Order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.body;

    const order = await orderModel.findById(id).populate("userId");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    let refundAmount = 0;
    for (const product of order.products) {
      if (product.status !== "Cancelled") {
        let productRefundAmount = product.price * product.quantity;

        if (order.coupon) {
          const coupon = await couponModel.findOne({ name: order.coupon });
          if (coupon) {
            const discountMultiplier = 1 - coupon.discountPercentage / 100;
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
      await orderModel.updateOne({ _id: id }, { $set: { totalAmount: 0 } });

      // Update wallet
      const walletData = await walletModel.findOne({
        userId: order.userId._id,
      });
      if (walletData) {
        walletData.balance += refundAmount;

        const transaction = {
          orderId: id,
          amount: refundAmount,
          description: "Cancelled",
          transactionType: "credit",
          paymentMethod: order.paymentMethod,
        };
        walletData.transactions.push(transaction);
        await walletData.save();
      }
    } else if (order.paymentMethod === "Wallet" && refundAmount > 0) {
      await orderModel.updateOne({ _id: id }, { $set: { totalAmount: 0 } });

      // Update wallet
      const walletData = await walletModel.findOne({
        userId: order.userId._id,
      });
      if (walletData) {
        walletData.balance += refundAmount;

        const transaction = {
          orderId: id,
          amount: refundAmount,
          description: "Cancelled",
          transactionType: "credit",
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
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// return order
const returnOrder = async (req, res) => {
  try {
    const { id } = req.body;

    const order = await orderModel.findById(id).populate("userId");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    let refundAmount = 0;

    for (const product of order.products) {
      if (product.status !== "Returned") {
        let productRefundAmount = product.price * product.quantity;

        // Apply coupon discount if applicable
        if (order.coupon) {
          const coupon = await couponModel.findOne({ name: order.coupon });
          if (coupon) {
            const discountMultiplier = 1 - coupon.discountPercentage / 100;
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

    // Update the wallet balance and add transaction for both COD , Razorpay & Wallet
    if (refundAmount > 0) {
      const walletData = await walletModel.findOne({
        userId: order.userId._id,
      });
      if (walletData) {
        walletData.balance += refundAmount;

        const transaction = {
          orderId: id,
          amount: refundAmount,
          description: "Returned",
          transactionType: "credit",
          paymentMethod: order.paymentMethod,
        };

        walletData.transactions.push(transaction);
        await walletData.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// cancel and reutrn for individual items
const cancelItem = async (req, res) => {
  try {
    const userData = await userModel.findOne({ email: req.session.user });
    const { itemId, id } = req.body;
    const item = new ObjectId(itemId);
    const orderData = await orderModel.findById(id);

    const cancelItem = await orderModel.aggregate([
      { $unwind: "$products" },
      { $match: { "products._id": item } },
    ]);

    if (!cancelItem.length) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    await productModel.updateOne(
      {
        _id: cancelItem[0].products.productId,
        "sizes.size": cancelItem[0].products.size,
      },
      {
        $inc: { "sizes.$.stock": cancelItem[0].products.quantity },
      }
    );

    await orderModel.updateOne(
      {
        _id: id,
        "products._id": itemId,
      },
      {
        $set: { "products.$.status": "Cancelled" },
      }
    );

    let subTotal =
      cancelItem[0].products.price * cancelItem[0].products.quantity;

    if (orderData.coupon) {
      const couponData = await couponModel.findOne({ name: orderData.coupon });
      if (couponData) {
        const discountMultiplier = 1 - couponData.discountPercentage / 100;
        subTotal = Math.round(
          Number((subTotal * discountMultiplier).toFixed(2))
        );
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
          description: "Cancelled",
          transactionType: "credit",
          paymentMethod: "Razorpay",
        };

        walletData.transactions.push(newTransaction);
        await walletData.save();
      }
    } else if (orderData.paymentMethod === "Wallet") {
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
          description: "Cancelled",
          transactionType: "credit",
          paymentMethod: "Wallet",
        };

        walletData.transactions.push(newTransaction);
        await walletData.save();
      }
    }

    // if all the products in the orde is cancelled then the full order will be cancelled.
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
    console.log(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const returnItem = async (req, res) => {
  try {
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
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
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
      (product) => product.status === "Returned"
    );

    if (allProductsReturned) {
      await orderModel.updateOne({ _id: id }, { $set: { status: "Returned" } });
    }

    // Calculate refund amount
    let refundAmount =
      returnItem[0].products.price * returnItem[0].products.quantity;

    // Apply coupon discount if available and calculate the amount !!
    if (orderData.coupon) {
      const couponData = await couponModel.findOne({ name: orderData.coupon });
      if (couponData) {
        const discountMultiplier = 1 - couponData.discountPercentage / 100;
        refundAmount = Math.round(refundAmount * discountMultiplier);
      }
    }

    // updating the order toalAmount !!
    const newOrderTotal = Math.max(0, orderData.totalAmount - refundAmount);
    await orderModel.updateOne(
      {
        _id: id,
      },
      {
        $set: { totalAmount: newOrderTotal },
      }
    );

    // if it is razorpay or cod update the wallet because its return item !!
    if (
      orderData.paymentMethod === "Razorpay" ||
      orderData.paymentMethod === "COD" ||
      orderData.paymentMethod === "Wallet"
    ) {
      const walletData = await walletModel.findOne({ userId: userData._id });

      walletData.balance += refundAmount;

      const newTransaction = {
        orderId: id,
        amount: refundAmount,
        description: "Returned",
        transactionType: "credit",
        paymentMethod: orderData.paymentMethod,
      };

      walletData.transactions.push(newTransaction);
      await walletData.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  ordersPage,
  viewOrder,
  cancelOrder,
  cancelItem,
  returnOrder,
  returnItem,
};
