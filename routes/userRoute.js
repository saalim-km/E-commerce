const express = require("express");
const router = express.Router();
const userSideController = require("../controllers/usersideController");
const customController = require("../controllers/customTshirt");
const onlinePayment = require('../controllers/onlinePayment');
const userMiddleware = require("../middlewares/isUser");
const cartController = require('../controllers/cart');
const wishListController = require('../controllers/wishlist');
const orderController = require('../controllers/order');
const checkoutController = require('../controllers/checkout');



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
router.get("/cart",userMiddleware.isLogin,cartController.loadCart);
router.post("/cart",cartController.addCart);
router.post("/cart/delete/:id",cartController.deleteCart);
router.post("/cart/updateQuantity",cartController.updateCartQuantity);
router.get('/cart_validate',cartController.validateCart)


// whislist
router.get("/wishlist",userMiddleware.isLogin,wishListController.wishListPage);
router.post("/wishlist",wishListController.addToWishlist);
router.get("/wishlist/remove/:id",wishListController.removeWishlist)



// checkout
router.get("/checkout",userMiddleware.isLogin,checkoutController.checkoutPage);
router.post('/checkout',checkoutController.checkout);
router.get("/order/:id",userMiddleware.isLogin,checkoutController.orderSuccess);
router.post('/online_order',checkoutController.onlineOrder);
router.post('/verify_order',checkoutController.verifyOrder);



// orders
router.get("/orders",userMiddleware.isLogin,orderController.ordersPage);
router.get("/ordersDetails/:id",userMiddleware.isLogin,orderController.viewOrder);
router.put("/cancel_order",orderController.cancelOrder);
router.put('/return_order',orderController.returnOrder);
router.post('/payment_failed',checkoutController.paymentFailed)


// cancel and order individual items
router.put('/order_cancel' , orderController.cancelItem);
router.put('/order_return' , orderController.returnItem);


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
router.get('/custom_order/:id',userMiddleware.isLogin,customController.orderSuccess);



// re-payment of failed order
router.post('/re_onlineOrder',onlinePayment.order_repayment);
router.post('/re_verifyOrder',onlinePayment.re_verifyOrder);


module.exports = router;