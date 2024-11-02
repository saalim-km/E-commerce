const dotenv = require("dotenv");
dotenv.config();
const cloudinary = require("../config/cloudinary");
const productModel = require("../models/product");
const categoryModel = require("../models/category");
const cartModel = require('../models/cart');
const path = require("path");


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
    console.log("Product added to database", result);
    req.flash("success", "Product added");
    res.redirect("/admin/addproducts");
  } catch (error) {
    console.log("Error while adding products", error.message);
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
      const productData = await productModel.find().populate("category","name").skip((perpage * page) - perpage).limit(perpage).sort({createdAt : -1});
      const productCount = await productModel.countDocuments({$or : [{isListed : true} , {isListed : false}]});
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
    const productData = await productModel.findById(productId).populate('category');
    const productCat = productData.category;
    const category = await categoryModel.find({isListed : true});
    
    console.log(`the product's data${productData}`,`the product category${productCat}`);
    res.render("editProduct",{product : productData , category , productCat : productCat})
  } catch (error) {
    console.log("error while loading product edit page",error.message);
  }
}

const updateCartsWithReducedStock = async (productId, updatedSizes) => {

  const carts = await cartModel.find({ productId });

  for (const cart of carts) {
    let cartUpdated = false;


    for (const cartItem of cart.sizes) {
      const updatedSize = updatedSizes.find(size => size.size === cartItem.size);

      if (updatedSize && updatedSize.stock < cartItem.quantity) {
        cartItem.quantity = updatedSize.stock;
        cartUpdated = true;
      }
    }

    // Save the cart if it was updated
    if (cartUpdated) {
      await cart.save();
      console.log(`Cart for user ${cart.userId} updated due to stock change.`);
    }
  }
};

const editProduct = async (req, res) => {
  try {
    console.log("request body:", req.body);
    console.log(req.files);

    const { productName, product_offer, salesPrice, description, category } = req.body;

    // Collect the new sizes and stocks
    const updatedSizes = [
      { size: 'S', stock: parseInt(req.body.s) },
      { size: 'M', stock: parseInt(req.body.m) },
      { size: 'L', stock: parseInt(req.body.l) },
      { size: 'XL', stock: parseInt(req.body.xl) },
    ];

    const productId = req.params.id;
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

      
      let stockReduced = false;
      const oldSizes = productExists.sizes;
      const sizesToUpdate = updatedSizes.map((newSize) => {
        const oldSize = oldSizes.find(size => size.size === newSize.size);
        if (oldSize && oldSize.stock > newSize.stock) {
          stockReduced = true; 
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
      console.log("Product updated in database", result);

      
      if (stockReduced) {
        console.log('Stock reduced, updating cart quantities...');
        await updateCartsWithReducedStock(productId, sizesToUpdate);
      }

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


// Product offer 
const addOfferPage = async(req,res)=> {
  try {
    const perpage = 3;
      const page = req.query.page || 1;

      const productData = await productModel.find().skip((perpage * page) - perpage).limit(perpage);
      const productCount = await productModel.countDocuments({$or : [{isListed : true} , {isListed : false}]});
      res.render("addOffer",{
        products : productData,
        currentPage : page,
        totalPages : Math.ceil(productCount / perpage),
      });
  } catch (error) {
    console.log(error.message);
  }
}

const addOffer = async(req,res)=> {
  try {
    console.log(req.body)
    const {id} = req.params;

    const  {offerPercentage , expiryDate} =  req.body;

    // product data
    const productData = await productModel.findById(id);
    // discount percentage %
    const offerDisconutPercentage = parseInt(offerPercentage);
    // getting product sales price
    const salesPrice = productData.salesPrice;
    // calculating salesPriceAferDiscount
    const salesPriceAfterDiscount = Math.trunc(salesPrice - (salesPrice / 100 * offerDisconutPercentage));


    const newOffer = {
      discountPercentage : offerDisconutPercentage,
      offerStartDate : new Date().toISOString(),
      offerExpiryDate : expiryDate,
    }

    if(productData.productOffer.length >= 1){
      const existingOfferId = productData.productOffer[0]._id;
      const offerUpdate = await productModel.updateOne(
        {
          _id : id,
          "productOffer._id" : existingOfferId,
        },
        {
          $set : {
            "productOffer.$.discountPercentage" : offerDisconutPercentage,
            "productOffer.$.offerStartDate" : new Date().toISOString(),
            "productOffer.$.offerExpiryDate" : expiryDate,
          }
        }
      );

      const productUpdate = await productModel.findByIdAndUpdate(id,{$set : {salesPriceAfterDiscount : salesPriceAfterDiscount}});
      if(offerUpdate){
        req.flash("success" , "Offer Updated");
        return res.redirect("/admin/add_offer");
      }
    }


    // saving the salesPriceAfterDiscount and offer object
    const productUpdate = await productModel.findByIdAndUpdate(id,{$set : {salesPriceAfterDiscount : salesPriceAfterDiscount}});
    productData.productOffer.push(newOffer);
    const result = await productData.save();

    console.log(result);

    if(result){
      req.flash("success","Offer added successfully")
      res.redirect("/admin/add_offer");
    }else {
      req.flash("error","Offer already exists on this product");
    }

  } catch (error) {
    req.flash("error","error while adding offer");
    console.log(error.message)
    return res.redirect("/admin/add_offer");
  }
}


// activate && de_activate offer
const deactivate_offer = async(req,res)=> {
  try {
    const {id} = req.params;
    const product = await productModel.findById(id);
    const offerId = product.productOffer[0]._id;
    const result = await productModel.updateOne(
      {
        _id : id,
        "productOffer._id" : offerId
      },
      {
        $set : {
          "productOffer.$.offerStatus" : false,
        }
      }
    )
    // console.log(result);
    req.flash("success","Offer De-Activated");
    return res.redirect("/admin/add_offer");
  } catch (error) {
    req.flash("error" , "an error occured please try again later");
    res.redirect("/admin/add_offer");
    console.log(error.message);
  }
}

const activate_offer = async(req,res)=> {
  try {
    const {id} = req.params;
    const product = await productModel.findById(id);
    const offerId = product.productOffer[0]._id;
    const result = await productModel.updateOne(
      {
        _id : id,
        "productOffer._id" : offerId
      },
      {
        $set : {
          "productOffer.$.offerStatus" : true,
        }
      }
    )
    // console.log(result);
    req.flash("success","Offer Activated");
    return res.redirect("/admin/add_offer");
  } catch (error) {
    req.flash("error" , "an error occured please try again later");
    res.redirect("/admin/add_offer");
    console.log(error.message);
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
  addOfferPage,
  addOffer,
  deactivate_offer,
  activate_offer,
};
