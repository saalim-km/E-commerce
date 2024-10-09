const productModel = require("../models/product");
const categoryModel = require("../models/category");
const path = require("path");
const sharp = require("sharp");

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
      category,
      sizes,
    } = req.body;
    const productSizes = [
      {size : 'S' , stock : sizes.s},
      {size : 'M' , stock : sizes.m},
      {size : 'L' , stock : sizes.l},
      {size : 'XL', stock : sizes.xl},
    ];
    const productExists = await productModel.findOne({
      productName: productName,
    });

    // checking if the product already exists.
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
        images: images,
        category: categoryId,
        sizes : productSizes,
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
      const perpage = 3;
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


const editProduct = async (req, res) => {
  try {
    console.log("request body : ",req.body);
    console.log(req.files);
    
    const {
      productName,
      regularPrice,
      salesPrice,
      description,
      category,
    } = req.body;

    // Extract sizes directly from req.body
    const productSizes = [
      { size: 'S', stock: req.body.s },
      { size: 'M', stock: req.body.m },
      { size: 'L', stock: req.body.l },
      { size: 'XL', stock: req.body.xl },
    ];

    const productId = req.params.id;
    const productExists = await productModel.findById(productId);

    if (productExists) {
      // Handle new image uploads
      let images = productExists.images;

      if (req.files && req.files.length > 0) {
        const newImages = [];
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const resizedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename
          );
          
          const sharpingImg = await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          
          if (!sharpingImg) {
            req.flash("error", "Error while resizing the image. Please try again.");
            return res.redirect("/admin/product/edit/" + productId);
          }
          newImages.push(req.files[i].filename);
        }
        images = [...images, ...newImages];
      }

      const categoryObj = await categoryModel.findOne({ name: category });
      const categoryId = categoryObj._id;
      // Update the product with new values
      productExists.productName = productName;
      productExists.regularPrice = regularPrice;
      productExists.salesPrice = salesPrice;
      productExists.description = description;
      productExists.images = images;
      productExists.category = categoryId; 
      productExists.sizes = productSizes;

      const result = await productExists.save();
      console.log("Product updated in database", result);
      req.flash("success", "Product updated successfully");
      res.redirect("/admin/products");
    } else {
      req.flash("error", "Product not found");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log("Error while updating product", error.message);
    req.flash("error", "Error while updating product");
    res.redirect("/admin/products");
  }
};

const removeImage = async(req,res)=> {
  try {
    console.log(req.body);
    const {productId , imageName} = req.body; 

    let product = await productModel.findById(productId);

    // filtering the product without the imagename from the frontend
    product.images = product.images.filter(img => img !== imageName);

    await product.save();
    res.json({success : true , message : "image removed successfully"});
  } catch (error) {
    res.status(500).json({success : false , message : "error removing image",error});
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
  removeImage
};
