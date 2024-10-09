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

module.exports = router;