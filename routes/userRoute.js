const express = require("express");
const router = express.Router();
const userSideController = require("../controllers/usersideController");


router.get("/products/:id",userSideController.productView);







router.get("/shop",userSideController.shopList);



module.exports = router;