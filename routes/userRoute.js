const express = require("express");
const router = express.Router();
const userSideController = require("../controllers/usersideController");
const userMiddleware = require("../middlewares/isUser");

// product details 
router.get("/products/:id",userSideController.productView);

// shopping page 
router.get("/shop",userSideController.shopList);

// user settings
router.get("/profile/:id",userMiddleware.isLogin,userSideController.userProfile);
router.put("/profile",userSideController.updateProfile);

// changing password
router.get("/password/:id",userMiddleware.isLogin,userSideController.passwordPage);
router.put("/password",userSideController.changePass);

// user address
router.get("/address/:id",userMiddleware.isLogin,userSideController.addPage);
router.post("/address",userSideController.addAddress);
router.post("/address/delete",userSideController.deleteAdd);

// cart routes
router.get("/cart",userMiddleware.isLogin,userSideController.loadCart);
router.post("/cart",userSideController.addCart);
router.post("/cart/delete/:id",userSideController.deleteCart);
router.post("/cart/updateQuantity",userSideController.updateCartQuantity);


// checkout
router.get("/checkout",userMiddleware.isLogin,userSideController.checkoutPage);
router.post('/checkout',userSideController.checkout);
router.get("/order/:id",userMiddleware.isLogin,userSideController.orderSuccess);


// orders
router.get("/orders/:id",userMiddleware.isLogin,userSideController.ordersPage);
router.get("/ordersDetails/:id",userMiddleware.isLogin,userSideController.viewOrder)

module.exports = router;