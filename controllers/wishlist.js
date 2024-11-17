const userModel = require("../models/user");
const wishlistModel = require("../models/wishlist");

// wishList
const wishListPage = async (req, res) => {
  try {
    // Find the user based on the session
    const userData = await userModel.findOne({ email: req.session.user });
    const userId = userData._id;

    // Find the wishlist for the user and populate the productId
    const wishListData = await wishlistModel
      .findOne({ userId: userId })
      .populate({
        path: "products.productId",
        model: "Products",
      });

    // Render the wishlist page with the user and populated wishlist data
    res.render("wishlist", { user: userData, wishlist: wishListData });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userData = await userModel.findOne({ email: req.session.user });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { productId } = req.body;

    const wishlist = await wishlistModel.findOne({ userId: userData._id });

    if (wishlist) {
      // Check if the product already exists in the wishlist
      const productExists = wishlist.products.some(
        (product) => product.productId.toString() === productId
      );

      if (productExists) {
        return res.status(200).json({
          success: false,
          message: "Product already exists in wishlist",
        });
      }

      // Add the new product to the existing wishlist
      wishlist.products.push({ productId });
      await wishlist.save();
    } else {
      const newWishlist = new wishlistModel({
        userId: userData._id,
        products: [{ productId }],
      });
      await newWishlist.save();
    }

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await userModel.findOne({ email: req.session.user });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    const result = await wishlistModel.updateOne(
      { userId: userData._id },
      { $pull: { products: { productId: id } } }
    );

    if (result.nModified === 0) {
      return res.status(400).send("Product not found in wishlist");
    }

    res.redirect("/user/wishlist");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

module.exports = {
  wishListPage,
  addToWishlist,
  removeWishlist,
};
