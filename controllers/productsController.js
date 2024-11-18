const dotenv = require("dotenv");
dotenv.config();
const cloudinary = require("../config/cloudinary");
const productModel = require("../models/product");
const categoryModel = require("../models/category");
const cartModel = require('../models/cart');
const path = require("path");


const loadAddProduct = async (req, res) => {
  try {
    const category = await categoryModel.find({isListed:true});
    res.render("addproducts", {
      category,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, product_offer, salesPrice, description, category, sizes } = req.body;

    const productSizes = [
      { size: "S", stock: sizes.s },
      { size: "M", stock: sizes.m },
      { size: "L", stock: sizes.l },
      { size: "XL", stock: sizes.xl },
    ];

    const productExists = await productModel.findOne({ productName });
    if (productExists) {
      req.flash("error", "already existing product");
      return res.redirect("/admin/addproducts");
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Upload directly from buffer using Cloudinary's upload_stream
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "product-images",
              width: 440,
              height: 440,
              crop: "fill",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        images.push(result.secure_url);
      }
    }

    const categoryObj = await categoryModel.findOne({ name: category });
    const categoryId = categoryObj._id;

    const newProduct = new productModel({
      productName,
      product_offer,
      salesPrice,
      description,
      images,
      category: categoryId,
      sizes: productSizes,
    });

    const result = await newProduct.save();
    req.flash("success", "Product added");
    res.redirect("/admin/addproducts");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

// products list
const productList = async(req,res)=> {
  try {
      const perpage = 5;
      const page = req.query.page || 1;

      const category = await categoryModel.find({isListed:true});
      const productData = await productModel.find().populate("category","name").skip((perpage * page) - perpage).limit(perpage).sort({createdAt : -1});
      const productCount = await productModel.countDocuments({$or : [{isListed : true} , {isListed : false}]});
      res.render("productList",{
        products : productData,
        currentPage : page,
        totalPages : Math.ceil(productCount / perpage),
        category,
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
}

// unlist product
const unListProduct = async(req,res)=> {
  try {
    const productId = req.params.id;
    const productExistsInCart = await cartModel.findOne({productId : productId});
    if(productExistsInCart){
      await cartModel.deleteOne({productId : productId});
    }
    const productData = await productModel.findByIdAndUpdate(productId,{isListed : false})
    req.flash("success","product unListed");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
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
    console.log(error.message);
    res.status(500).render('500');
  }
}

// loading edit page
const loadEditPage = async(req,res)=> {
  try {
    const productId = req.params.id;
    const productData = await productModel.findById(productId).populate('category');
    const productCat = productData.category;
    const category = await categoryModel.find({isListed : true});
    
    res.render("editProduct",{product : productData , category , productCat : productCat})
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
}

// updating cart 
const updateCartsWithReducedStock = async (productId, updatedSizes) => {
  try {
    // Fetch all carts containing the product
    const carts = await cartModel.find({ productId });

    for (const cart of carts) {
      let sizeModified = false;

      // Update sizes in the cart
      cart.sizes = cart.sizes.map((cartSize) => {
        const updatedSize = updatedSizes.find(size => size.size === cartSize.size);
        if (updatedSize) {
          if (cartSize.quantity > updatedSize.stock) {
            
            cartSize.quantity = updatedSize.stock;
            sizeModified = true;
          } else if (updatedSize.stock > 0 && cartSize.quantity === 0) {
           
            cartSize.quantity = 1;
            sizeModified = true;
          }
        }
        return cartSize;
      });

      // Save the updated cart if any size was modified
      if (sizeModified) {
        await cart.save();
        console.log(`Cart with id ${cart._id} updated successfully.`);
      }
    }
  } catch (error) {
    console.error("Error updating carts with changed stock:", error.message);
  }
};

// post request
const editProduct = async (req, res) => {
  try {

    const { productName, product_offer, salesPrice, description, category } = req.body;
    const categoryData = await categoryModel.findOne({name : category});

    // Collect the new sizes and stocks
    const updatedSizes = [
      { size: 'S', stock: parseInt(req.body.s) },
      { size: 'M', stock: parseInt(req.body.m) },
      { size: 'L', stock: parseInt(req.body.l) },
      { size: 'XL', stock: parseInt(req.body.xl) },
    ];

    const productId = req.params.id;
    const product = await productModel.findById(productId);
    console.log(categoryData)
    if(categoryData.categoryOffer.length > 0) {

      const offerDiscountPercentage = categoryData.categoryOffer[0].discountPercentage;
      const salesPrice = product.salesPrice;
      const salesPriceAfterDiscount = Math.round(salesPrice - (salesPrice / 100 * offerDiscountPercentage));
      const discountAmount = Math.round(salesPrice / 100 * offerDiscountPercentage);

      if (product.productOffer.length > 0) {
        await productModel.updateOne(
          {
            _id: productId,
            "productOffer._id": product.productOffer[0]._id,
          },
          {
            $set: {
              "productOffer.$.discountPercentage": offerDiscountPercentage,
              "productOffer.$.offerStartDate": categoryData.categoryOffer[0].offerStartDate,
              "productOffer.$.offerExpiryDate": categoryData.categoryOffer[0].offerExpiryDate,
              salesPriceAfterDiscount: salesPriceAfterDiscount,
              discountAmount : discountAmount,
            }
          }
        );
      }else {
        const newPrOffer = {
          discountPercentage : offerDiscountPercentage,
          offerStartDate : categoryData.categoryOffer[0].offerStartDate,
          offerExpiryDate : categoryData.categoryOffer[0].offerExpiryDate,
          discountAmount : discountAmount,
        }
        product.productOffer.push(newPrOffer);
        product.salesPriceAfterDiscount = salesPriceAfterDiscount;
        await product.save();
      }
    }

    const productExists = await productModel.findById(productId);

    if (productExists) {

      let images = productExists.images;

      if (req.files && req.files.length > 0) {
        const newImages = [];
        for (const file of req.files) {
       
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "product-images",
                width: 440,
                height: 440,
                crop: "fill",
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            uploadStream.end(file.buffer);
          });

          newImages.push(result.secure_url);
        }
        images = [...images, ...newImages];
      }

      const categoryObj = await categoryModel.findOne({ name: category });
      const categoryId = categoryObj ? categoryObj._id : null;

      
      let stockChanged = false; 
      let stockReduced = false; 
      const oldSizes = productExists.sizes;
      
      console.log("Old Sizes:", oldSizes);
      console.log("Updated Sizes:", updatedSizes);
      
      const sizesToUpdate = updatedSizes.map((newSize) => {
        const oldSize = oldSizes.find(size => size.size === newSize.size);
        
        if (oldSize) {
          if (oldSize.stock !== newSize.stock) {
            stockChanged = true; 
          }
          if (oldSize.stock > newSize.stock) {
            stockReduced = true;
          }
        }
        
        return newSize;
      });

     
      productExists.productName = productName;
      productExists.product_offer = product_offer;
      productExists.salesPrice = salesPrice;
      productExists.description = description;
      productExists.images = images;
      productExists.category = categoryId;
      productExists.sizes = sizesToUpdate;

      const result = await productExists.save();

      
      if (stockChanged) {
        await updateCartsWithReducedStock(productId, sizesToUpdate);
      }

      req.flash("success", "Product updated successfully");
      res.redirect("/admin/products");
    } else {
      req.flash("error", "Product not found");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.stack);
    req.flash("error", "Error while updating product");
    res.redirect("/admin/products");
  }
};

// function for removing the image from DB
const removeImage = async(req,res)=> {
  try {
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
  removeImage,
};