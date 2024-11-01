const Category = require("../models/category");
const productModel = require("../models/product");  

//  all categories
const getAllCategories = async (req, res) => {
  try {
    if(!req.session.admin){
      return res.redirect("/admin/login");
    }else{
    const categories = await Category.find().sort({createdAt : -1});
    res.render("categories", { categories });
    }
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not retrieve categories");
    res.redirect("/admin");
  }
};

//  new category
const createCategory = async (req, res) => {
  const { name, description } = req.body;
    console.log(name,description);
    
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    req.flash("error", "Category already exists");
    return res.redirect("/admin/categories");
  }

  const newCategory = new Category({
    name,
    description,
    status: "listed", 
  });

  try {
    await newCategory.save();
    req.flash("success", "Category added successfully");
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not add category");
    res.redirect("/admin/categories");
  }
};

//  edit category 
const editCategoryForm = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    res.render("editCategory", { category }); // Make sure this path is correct
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not retrieve category for editing");
    res.redirect("/admin/categories");
  }
};

// update  category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const categoryData = await Category.findById(id);
    if (!categoryData) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/categories");
    }

    const existingCat = await Category.findOne({ name, _id: { $ne: id } });
    if (existingCat) {
      req.flash("error", "Category name already exists");
      return res.redirect("/admin/categories");
    }

    const update = {
      name : name,
      description : description,
    };

      await Category.findByIdAndUpdate(id, update);
      req.flash("success", "Category updated successfully");

    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not update category");
    res.redirect("/admin/categories");
  }
};

const toggleCategoryStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    category.isListed = category.isListed ? false : true;
    await category.save();
    req.flash(
      "success",
      `Category ${
        category.isListed ? "listed" : "unlisted"
      } successfully`
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not toggle category status");
    res.redirect("/admin/categories");
  }
};


// offer
const categoryOffer = async(req,res)=> {
  try {
    const perpage = 3;
    const page = req.query.page || 1;
    
    const categoryData = await Category.find({isListed : true}).skip((perpage * page) - perpage).limit(perpage);
    const categoryCount = await Category.countDocuments();
    res.render("categoryOffer",{
      categories : categoryData,
      currentPage : page,
      totalPages : Math.ceil(categoryCount / perpage),
    });
  } catch (error) {
    console.log("error in ")
  }
}

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
      offerStatus: true
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
            "categoryOffer.$.offerStatus": true,
          }
        }
      );
    } else {
      categoryData.categoryOffer.push(newOffer);
      await categoryData.save();
    }


    const productsInCategory = await productModel.find({ category: id });

    for (const product of productsInCategory) {
      const salesPrice = product.salesPrice;
      const salesPriceAfterDiscount = Math.trunc(salesPrice - (salesPrice / 100 * offerDiscountPercentage));

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
              "productOffer.$.offerStatus": true,
              salesPriceAfterDiscount: salesPriceAfterDiscount
            }
          }
        );
      } else {
        product.productOffer.push(newOffer);
        product.salesPriceAfterDiscount = salesPriceAfterDiscount;
        await product.save();
      }
    }

    req.flash("success", "Offer added/updated successfully for the category and all its products");
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log("Error in adding offer to category:", error.message);
    req.flash("error", "An error occurred while adding the offer");
    res.redirect("/admin/categoryOffer");
  }
};

// activating or de-activating offer
const deactivateOffer = async(req,res)=> {
  try {
    const {id} = req.params;
    const categoryData = await Category.findById(id);
    const catOfferId = categoryData.categoryOffer[0]._id;
    const updateCat = await Category.updateOne(
      {
        _id: id,
        'categoryOffer._id' : catOfferId
      },
      {
        $set : {'categoryOffer.$.offerStatus' : false}
      }
    );

    const productsInCategory = await productModel.find({ category: id });
    console.log('category offer status updated')

    // Deactivate offer for all products in the category
    for (const product of productsInCategory) {
        let offerId = product.productOffer[0]._id;
        const updateProduct = await productModel.updateOne(
          {
            _id : product._id,
            'productOffer._id' : offerId,
          },
          {
            $set : {
              "productOffer.$.offerStatus" : false
            }
          }
        );
    }

    req.flash("success", "Offer deactivated for the category and all its products");
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log("error while de-activating the category offer",error.message);
  }
}

const activateOffer = async(req,res)=> {
  try {
    const {id} = req.params;
    const categoryData = await Category.findById(id);
    const catOfferId = categoryData.categoryOffer[0]._id;
    const updateCat = await Category.updateOne(
      {
        _id: id,
        'categoryOffer._id' : catOfferId
      },
      {
        $set : {'categoryOffer.$.offerStatus' : true}
      }
    );

    const productsInCategory = await productModel.find({ category: id });
    console.log(productsInCategory)

    // Deactivate offer for all products in the category
    for (const product of productsInCategory) {
      if (product.productOffer.length > 0) {
        let offerId = product.productOffer[0]._id;
        const updateProduct = await productModel.updateOne(
          {
            _id : product._id,
            "productOffer._id" : offerId
          },
          {
            $set : {
              "productOffer.$.offerStatus" : true
            }
          }
        );
      }
    }

    req.flash("success", "Offer activated for the category and all its products");
    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log("error in activateOffer",error.message);
  }
}
module.exports = {
  getAllCategories,
  createCategory,
  editCategoryForm,
  updateCategory,
  toggleCategoryStatus,
  categoryOffer,
  addOffer,
  deactivateOffer,
  activateOffer
};
