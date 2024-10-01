const productModel = require("../models/product");
const categoryModel = require("../models/category");
const path = require("path");
const sharp = require("sharp");
const category = require("../models/category");
const product = require("../models/product");

const loadAddProduct = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }
    const category = await categoryModel.find({isListed:true});
    res.render("addproducts", {
      category,
    });
  } catch (error) {
    console.log("error while loading product adding page", error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);
    const {
      productName,
      regularPrice,
      salesPrice,
      description,
      quantity,
      category,
      sizes,
    } = req.body;
    const productExists = await productModel.findOne({
      productName: productName,
    });

    // checking if the user already exists.
    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;

          const reziedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename
          );
          const sharpingImg = await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(reziedImagePath);
          if (!sharpingImg) {
            req.flash(
              "error",
              "error while rezising the image please try again"
            );
            return res.redirect("/admin/addproducts");
          }
          images.push(req.files[i].filename);
        }
      }

      //   fetching category ._id
      const categoryObj = await categoryModel.findOne({ name: category });
      const categoryId = categoryObj._id;

      const newProduct = new productModel({
        productName,
        regularPrice,
        salesPrice,
        description,
        quantity,
        images: images,
        category: categoryId,
        sizes : sizes.split(',').map(size=> size.trim()),
      });
      const result = await newProduct.save();
      console.log("product added to database", result);
      req.flash("success", "product added");
      res.redirect("/admin/addproducts");
    } else {
      req.flash("error", "already existing product");
      res.redirect("/admin/addproducts");
    }
  } catch (error) {
    console.log("error while adding products", error.message);
  }
};





// products list
const productList = async(req,res)=> {
  try {
    if(!req.session.admin){
      return res.redirect("/admin/login");
    }else{
      const perpage = 5;
      const page = req.query.page || 1;

      const category = await categoryModel.find({isListed:true});
      const productData = await productModel.find().populate("category","name").skip((perpage * page) - perpage).limit(perpage);
      const productCount = await productModel.countDocuments({isListed : true});
      res.render("productList",{
        products : productData,
        currentPage : page,
        totalPages : Math.ceil(productCount / perpage),
        category,
      });
    }
  } catch (error) {
    console.log("error while loading the product list page",error.message);
  }
}

// unlist product
const unListProduct = async(req,res)=> {
  try {
    const productId = req.params.id;
    const productData = await productModel.findByIdAndUpdate(productId,{isListed : false})
    req.flash("success","product unListed");
    res.redirect("/admin/products");
  } catch (error) {
    console.log("error while unLising the product",error.message);
  }
}

// listing product
const listProduct = async(req,res)=> {
  try {
    const productId = req.params.id;
    await productModel.findByIdAndUpdate(productId,{isListed : true});
    req.flash("success","product Listed");
    res.redirect("/admin/products");
  } catch (error) {
    console.log("error while listing product",error.message); 
  }
}

// loading edit page
const loadEditPage = async(req,res)=> {
  try {
    const productId = req.params.id;
    const productData = await productModel.findById(productId);
    const category = await categoryModel.find({isListed : true})
    res.render("editProduct",{product : productData , category})
  } catch (error) {
    console.log("error while loading product edit page",error.message);
  }
}

// updating the product info
const editProduct = async(req,res)=> {
  try {
    const {
      productName,
      regularPrice,
      salesPrice,
      description,
      quantity,
      category,
      sizes,
    } = req.body;
    const productId = req.params.id;
    const productData = await productModel.findByIdAndUpdate(productId,{
      productName : productName,
      regularPrice : regularPrice,
      salesPrice : salesPrice,
      description : description,
      quantity : quantity, 
      category : category,
      sizes : sizes.split(',').map(size=> size.trim()),
    });
    console.log(productData);
    res.redirect("/admin/products");
  } catch (error) {
    console.log("error while editing product",error.message);
  }
}

module.exports = {
  loadAddProduct,
  addProduct,
  productList,
  unListProduct,
  listProduct,
  loadEditPage,
  editProduct,
};
