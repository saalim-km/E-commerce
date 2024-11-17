const productModel = require("../models/product");
const userModel = require("../models/user");
const cartModel = require("../models/cart");

// cart
const addCart = async (req, res) => {
  try {
    const email = req.session.user;
    const userData = await userModel.findOne({ email });

    const { categoryId, productId, size, quantity } = req.body;

    const maxLimit = 5;

    // checkint if the cart already exists
    const cartExists = await cartModel.findOne({
      userId: userData._id,
      productId: productId,
      "sizes.size": size,
    });

    const productData = await productModel.findById(productId);
    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    // Find the size stock of the product
    const productSize = productData.sizes.find((item) => item.size === size);
    if (!productSize) {
      return res
        .status(404)
        .json({ success: false, message: "Product size not found." });
    }

    const stockAvailable = productSize.stock;

    if (cartExists) {
      // If the cart item exists
      const currentQuantityInCart = cartExists.sizes.find(
        (item) => item.size === size
      ).quantity;

      const totalQuantity = currentQuantityInCart + Number(quantity);

      // Check if adding the new quantity exceeds the stock or user limit
      if (totalQuantity > stockAvailable) {
        return res.json({
          success: false,
          message: `Stock limit reached`,
        });
      }

      if (totalQuantity > maxLimit) {
        return res.json({
          success: false,
          message: `Cannot add more than ${maxLimit} items of this product.`,
        });
      }

      // Update the cart with the new quantity
      await cartModel.updateOne(
        {
          userId: userData._id,
          productId: productId,
          "sizes.size": size,
        },
        { $inc: { "sizes.$.quantity": Number(quantity) } }
      );

      res.json({ success: true });
    } else {
      // Check if the quantity exceeds the max limit when adding a new cart item
      if (quantity > maxLimit) {
        return res.json({
          success: false,
          message: `Cannot add more than ${maxLimit} items of this product.`,
        });
      }

      const items = [
        {
          size: size,
          quantity: quantity,
        },
      ];

      const newCart = new cartModel({
        userId: userData._id,
        productId: productId,
        categoryId: categoryId,
        sizes: items,
      });

      await newCart.save();
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const loadCart = async (req, res) => {
  try {
    // Check if the user is logged in
    const email = req.session.user;
    if (!email) {
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }

    // Fetch the user details
    const userDetails = await userModel.findOne({ email });
    if (!userDetails) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Fetch the user's cart and populate product and category details
    const cartDetails = await cartModel
      .find({ userId: userDetails._id })
      .populate({
        path: "productId",
        select:
          "productName salesPrice images sizes salesPriceAfterDiscount offerStatus productOffer isListed",
      })
      .populate("categoryId");

    // Map through cart items and attach available stock for each size
    const updatedCartDetails = cartDetails.map((item) => {
      const cartItem = item.toObject(); // Convert Mongoose document to plain JS object
      const sizeInCart = cartItem.sizes[0].size;

      // Find the corresponding size object in the product's size array
      const sizeObject = cartItem.productId.sizes.find(
        (size) => size.size === sizeInCart
      );

      // If size found, attach stock, otherwise set stock to 0
      cartItem.availableStock = sizeObject ? sizeObject.stock : 0;

      return cartItem;
    });

    // Render the cart page with updated cart details
    res.render("cart", { cart: updatedCartDetails, user: userDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// updating cart quantity
const updateCartQuantity = async (req, res) => {
  try {
    const { size, action, cartItemId } = req.body;

    const cartItem = await cartModel.findById(cartItemId).populate("productId");
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    const productSize = cartItem.productId.sizes.find((s) => s.size === size);
    if (!productSize) {
      return res.status(400).json({ success: false, message: "Invalid size" });
    }

    const cartSize = cartItem.sizes.find((s) => s.size === size);

    if (action === "increase") {
      if (cartSize.quantity >= 5) {
        return res.json({ success: false, message: "limit reached" });
      }
      if (cartSize.quantity < productSize.stock) {
        cartSize.quantity += 1;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Stock limit reached." });
      }
    } else if (action === "decrease") {
      if (cartSize.quantity > 1) {
        cartSize.quantity -= 1;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Quantity cannot be less than 1." });
      }
    }

    await cartItem.save();
    return res.json({ success: true, message: "Cart updated successfully." });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const deleteCart = async (req, res) => {
  try {
    const cartId = req.params.id;
    const result = await cartModel.findByIdAndDelete(cartId);
    if (result) {
      res.redirect("/user/cart");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

module.exports = {
  addCart,
  loadCart,
  deleteCart,
  updateCartQuantity,
};
