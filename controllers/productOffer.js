const dotenv = require("dotenv");
dotenv.config();
const cloudinary = require("../config/cloudinary");
const productModel = require("../models/product");
const categoryModel = require("../models/category");
const cartModel = require("../models/cart");
const path = require("path");

// Product offer
const addOfferPage = async (req, res) => {
  try {
    const perpage = 3;
    const page = req.query.page || 1;

    const productData = await productModel
      .find()
      .skip(perpage * page - perpage)
      .limit(perpage);
    const productCount = await productModel.countDocuments({
      $or: [{ isListed: true }, { isListed: false }],
    });
    res.render("addOffer", {
      products: productData,
      currentPage: page,
      totalPages: Math.ceil(productCount / perpage),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

const addOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const { offerPercentage, expiryDate } = req.body;

    // product data
    const productData = await productModel.findById(id);
    // discount percentage %
    const offerDisconutPercentage = parseInt(offerPercentage);
    // getting product sales price
    const salesPrice = productData.salesPrice;
    // calculating salesPriceAferDiscount
    const salesPriceAfterDiscount = Math.round(
      salesPrice - (salesPrice / 100) * offerDisconutPercentage
    );
    // discount Amount
    const discountAmount = Math.round(
      (salesPrice / 100) * offerDisconutPercentage
    );

    const newOffer = {
      discountPercentage: offerDisconutPercentage,
      offerStartDate: new Date().toISOString(),
      offerExpiryDate: expiryDate,
      discountAmount: discountAmount,
    };

    if (productData.productOffer.length >= 1) {
      const existingOfferId = productData.productOffer[0]._id;
      const offerUpdate = await productModel.updateOne(
        {
          _id: id,
          "productOffer._id": existingOfferId,
        },
        {
          $set: {
            "productOffer.$.discountPercentage": offerDisconutPercentage,
            "productOffer.$.offerStartDate": new Date().toISOString(),
            "productOffer.$.offerExpiryDate": expiryDate,
          },
        }
      );

      const productUpdate = await productModel.findByIdAndUpdate(id, {
        $set: { salesPriceAfterDiscount: salesPriceAfterDiscount },
      });
      if (offerUpdate) {
        req.flash("success", "Offer Updated");
        return res.redirect("/admin/add_offer");
      }
    }

    // saving the salesPriceAfterDiscount and offer object
    const productUpdate = await productModel.findByIdAndUpdate(id, {
      $set: { salesPriceAfterDiscount: salesPriceAfterDiscount },
    });
    productData.productOffer.push(newOffer);
    const result = await productData.save();

    if (result) {
      req.flash("success", "Offer added successfully");
      res.redirect("/admin/add_offer");
    } else {
      req.flash("error", "Offer already exists on this product");
    }
  } catch (error) {
    req.flash("error", "error while adding offer");
    return res.redirect("/admin/add_offer");
  }
};

// activate && de_activate offer
const deactivate_offer = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    const offerId = product.productOffer[0]._id;
    const result = await productModel.updateOne(
      {
        _id: id,
        "productOffer._id": offerId,
      },
      {
        $set: {
          "productOffer.$.offerStatus": false,
        },
      }
    );
    req.flash("success", "Offer De-Activated");
    return res.redirect("/admin/add_offer");
  } catch (error) {
    req.flash("error", "an error occured please try again later");
    res.redirect("/admin/add_offer");
  }
};

const activate_offer = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    const offerId = product.productOffer[0]._id;
    const result = await productModel.updateOne(
      {
        _id: id,
        "productOffer._id": offerId,
      },
      {
        $set: {
          "productOffer.$.offerStatus": true,
        },
      }
    );
    req.flash("success", "Offer Activated");
    return res.redirect("/admin/add_offer");
  } catch (error) {
    req.flash("error", "an error occured please try again later");
    res.redirect("/admin/add_offer");
  }
};

module.exports = {
  addOfferPage,
  addOffer,
  deactivate_offer,
  activate_offer,
};