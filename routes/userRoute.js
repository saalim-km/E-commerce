const express = require("express");
const router = express.Router();
const userSideController = require("../controllers/usersideController");
const userMiddleware = require("../middlewares/isUser");



// shopping page 
router.get("/shop",userSideController.shopList);

// product details 
router.get("/products/:id",userSideController.productView);

// user settings
router.get("/profile",userMiddleware.isLogin,userSideController.userProfile);
router.put("/profile",userSideController.updateProfile);

// changing password
router.get("/password",userMiddleware.isLogin,userSideController.passwordPage);
router.put("/password",userSideController.changePass);

// user address
router.get("/address",userMiddleware.isLogin,userSideController.addPage);
router.post("/address",userSideController.addAddress);
router.post("/address/delete",userSideController.deleteAdd);
router.get("/edit_Address/:id",userMiddleware.isLogin,userSideController.editAddPage)
router.post("/edit_Address/:id",userSideController.updateEditAdd)

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
router.get("/orders",userMiddleware.isLogin,userSideController.ordersPage);
router.get("/ordersDetails/:id",userMiddleware.isLogin,userSideController.viewOrder);
router.put("/cancel_order",userSideController.cancelOrder)
module.exports = router;