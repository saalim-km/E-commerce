const express = require("express");
const router = express.Router();
const userSideController = require("../controllers/usersideController");
const customController = require("../controllers/customTshirt");
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

// whislist
router.get("/wishlist",userMiddleware.isLogin,userSideController.wishListPage);
router.post("/wishlist",userSideController.addToWishlist);
router.get("/wishlist/remove/:id",userSideController.removeWishlist)

// checkout
router.get("/checkout",userMiddleware.isLogin,userSideController.checkoutPage);
router.post('/checkout',userSideController.checkout);
router.get("/order/:id",userMiddleware.isLogin,userSideController.orderSuccess);
router.post('/online_order',userSideController.onlineOrder);
router.post('/verify_order',userSideController.verifyOrder);


// orders
router.get("/orders",userMiddleware.isLogin,userSideController.ordersPage);
router.get("/ordersDetails/:id",userMiddleware.isLogin,userSideController.viewOrder);
router.put("/cancel_order",userSideController.cancelOrder);
router.put('/return_order',userSideController.returnOrder);


// cancel and order individual items
router.put('/order_cancel' , userSideController.cancelItem);
router.put('/order_return' , userSideController.returnItem);

// when the offer expires
router.post('/update-offer-status',userSideController.updateOffer)

// validate coupon
router.post("/validate-coupon",userSideController.validateCoupon);

// wallet
router.get("/wallet",userMiddleware.isLogin,userSideController.walletPage);


// Invoice
router.get("/download_invoice/:id",userSideController.downloadInvoice);


// custom t-shirt
router.get("/custom_tshirt",userMiddleware.isLogin,customController.loadCustomPage);

router.get("/custom-tshirt/design",userMiddleware.isLogin,customController.designPage);

// saving design
router.post("/design/save",customController.saveDesign);

router.get("/designs",userMiddleware.isLogin,customController.getDesign);

router.get('/custom_checkout',userMiddleware.isLogin,customController.getCheckout);

router.post('/delete_design',customController.deleteDesign);

router.post("/custom_checkout",customController.checkout);

router.get('/custom_order/:id',userMiddleware.isLogin,customController.orderSuccess)
module.exports = router;