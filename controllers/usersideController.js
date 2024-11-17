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
const mongoose = require('mongoose');
const Razorpay = require("razorpay");
const { ObjectId } = require("mongoose").Types;
const PDFDocument = require("pdfkit");

// Razor pay configuration
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// product detail page
const productView = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/user/login");
    } else {
      const productId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(404).render('404', { title: '404 - Product Not Found' });
    }
      const user = req.session.user;
      const userData = await userModel.findOne({ email: user });
      const productData = await productModel
        .findById(productId)
        .populate("category", "name");
      res.render("productView", { product: productData, user: userData });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
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

      const limit = 8;
      const skip = (page - 1) * limit;

      let query = { isListed: true };

      if (category && category !== "All Categories") {
        query["category"] = category;
      }

      if (search) {
        query.productName = { $regex: search, $options: "i" };
      }

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
    console.log(error.message);
    res.status(500).render('500');
  }
};

// user profile 
const userProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await userModel.findOne({ email: userId });
    res.render("userDetails", { userData: userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

// updating user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone } = req.body;
    const userExist = await userModel.findOne({ name });
    if (userExist) {
      res.json({ success: false });
    } else {
      const result = await userModel.findByIdAndUpdate(userId, {
        username: name,
        phone: phone,
      });
      res.json({ success: true });
    }
  } catch (error) {
    res.json({ error: false });
  }
};

// GET change password
const passwordPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await userModel.findOne({ email: userId });
    res.render("password", { userData: userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};
// POST change pass
const changePass = async (req, res) => {
  try {
    const { oldPass, newPass, userId } = req.body;
    const userData = await userModel.findById(userId);
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
  } catch (error) {
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
    console.log(error.message);
    res.status(500).render('500');
  }
};

// adding address
const addAddress = async (req, res) => {
  try {
    const userEmail = req.session.user;
    const user = await userModel.findOne({ email: userEmail });
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
    res.status(500).json({success : false ,  message: "an error occured while deleting address" });
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
    console.log(error.message);
    res.status(500).render('500');
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
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// validate coupon
const validateCoupon = async (req, res) => {
  try {
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
    console.log(error.message);
    res.status(500).render('500');
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
    res.status(500).json({success : false ,  message: "An error occurred while generating the invoice" });
  }
};

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
  editAddPage,
  updateEditAdd,
  updateOffer,
  validateCoupon,
  walletPage,
  downloadInvoice,
};