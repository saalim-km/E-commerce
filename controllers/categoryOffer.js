const Category = require("../models/category");
const productModel = require("../models/product");

// GET Category Offer
const categoryOffer = async (req, res) => {
  try {
    const perpage = 3;
    const page = req.query.page || 1;

    const categoryData = await Category.find({ isListed: true })
      .skip(perpage * page - perpage)
      .limit(perpage);
    const categoryCount = await Category.countDocuments();
    res.render("categoryOffer", {
      categories: categoryData,
      currentPage: page,
      totalPages: Math.ceil(categoryCount / perpage),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

const addOffer = async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.params;

    const { offerPercentage, expiryDate } = req.body;

    // Category data
    const categoryData = await Category.findById(id);
    if (!categoryData) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/categoryOffer");
    }

    // Discount percentage %
    const offerDiscountPercentage = parseInt(offerPercentage);

    const newOffer = {
      discountPercentage: offerDiscountPercentage,
      offerStartDate: new Date().toISOString(),
      offerExpiryDate: expiryDate,
    };

    if (categoryData.categoryOffer.length >= 1) {
      const existingOfferId = categoryData.categoryOffer[0]._id;
      await Category.updateOne(
        {
          _id: id,
          "categoryOffer._id": existingOfferId,
        },
        {
          $set: {
            "categoryOffer.$.discountPercentage": offerDiscountPercentage,
            "categoryOffer.$.offerStartDate": new Date().toISOString(),
            "categoryOffer.$.offerExpiryDate": expiryDate,
          },
        }
      );
    } else {
      categoryData.categoryOffer.push(newOffer);
      await categoryData.save();
    }

    const productsInCategory = await productModel.find({ category: id });

    for (const product of productsInCategory) {
      const salesPrice = product.salesPrice;
      const salesPriceAfterDiscount = Math.round(
        salesPrice - (salesPrice / 100) * offerDiscountPercentage
      );
      const discountAmount = Math.round(
        (salesPrice / 100) * offerDiscountPercentage
      );
      // if there is offer alrady exists then updaate the existing offer.
      if (product.productOffer.length >= 1) {
        await productModel.updateOne(
          {
            _id: product._id,
            "productOffer._id": product.productOffer[0]._id,
          },
          {
            $set: {
              "productOffer.$.discountPercentage": offerDiscountPercentage,
              "productOffer.$.offerStartDate": new Date().toISOString(),
              "productOffer.$.offerExpiryDate": expiryDate,
              salesPriceAfterDiscount: salesPriceAfterDiscount,
              discountAmount: discountAmount,
            },
          }
        );
      } else {
        // or add new offer to the products in the category.
        const newPrOffer = {
          discountPercentage: offerDiscountPercentage,
          offerStartDate: new Date().toISOString(),
          offerExpiryDate: expiryDate,
          discountAmount: Math.round(
            (salesPrice / 100) * offerDiscountPercentage
          ),
        };
        product.productOffer.push(newPrOffer);
        product.salesPriceAfterDiscount = salesPriceAfterDiscount;
        await product.save();
      }
    }

    req.flash(
      "success",
      "Offer added/updated successfully for the category and all its products"
    );
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log("Error in adding offer to category:", error.message);
    req.flash("error", "An error occurred while adding the offer");
    res.redirect("/admin/categoryOffer");
  }
};

// activating or de-activating offer
const deactivateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = await Category.findById(id);
    const catOfferId = categoryData.categoryOffer[0]._id;
    const updateCat = await Category.updateOne(
      {
        _id: id,
        "categoryOffer._id": catOfferId,
      },
      {
        $set: { "categoryOffer.$.offerStatus": false },
      }
    );

    const productsInCategory = await productModel.find({ category: id });
    console.log("category offer status updated");

    // Deactivate offer for all products in the category
    for (const product of productsInCategory) {
      let offerId = product.productOffer[0]._id;
      const updateProduct = await productModel.updateOne(
        {
          _id: product._id,
          "productOffer._id": offerId,
        },
        {
          $set: {
            "productOffer.$.offerStatus": false,
          },
        }
      );
    }

    req.flash(
      "success",
      "Offer deactivated for the category and all its products"
    );
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "An error occurred please try agian later");
    res.redirect("/admin/categoryOffer");
  }
};

const activateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = await Category.findById(id);
    const catOfferId = categoryData.categoryOffer[0]._id;
    const updateCat = await Category.updateOne(
      {
        _id: id,
        "categoryOffer._id": catOfferId,
      },
      {
        $set: { "categoryOffer.$.offerStatus": true },
      }
    );

    const productsInCategory = await productModel.find({ category: id });
    console.log(productsInCategory);

    // Deactivate offer for all products in the category
    for (const product of productsInCategory) {
      if (product.productOffer.length > 0) {
        let offerId = product.productOffer[0]._id;
        const updateProduct = await productModel.updateOne(
          {
            _id: product._id,
            "productOffer._id": offerId,
          },
          {
            $set: {
              "productOffer.$.offerStatus": true,
            },
          }
        );
      }
    }

    req.flash(
      "success",
      "Offer activated for the category and all its products"
    );
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "An error occurred please try agian later");
    res.redirect("/admin/categoryOffer");
  }
};

module.exports = {
  categoryOffer,
  addOffer,
  deactivateOffer,
  activateOffer,
};
