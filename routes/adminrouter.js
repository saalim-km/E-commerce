const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const productController = require("../controllers/productsController");
const orderController = require("../controllers/orderController");
const multer = require('multer');
const storage = require("../config/multer");
const uploads = multer({storage : storage});
const categoriesController = require("../controllers/categoriesController");
const adminMiddleware = require("../middlewares/isAdmin");

// login routes
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.adminLogin);


// dashboard route
router.get('/',adminMiddleware.isAdmin,adminController.dashboardLoad);


// logout
router.get('/logout',adminController.Logout);
// userList
router.get('/users',userController.userList);
// Block user
router.post('/user/block',userController.userBlock);
// unBlock user
router.post("/user/unblock",userController.userUnBlock);




// Categories 
// Get all categories
router.get('/categories', categoriesController.getAllCategories);
// Create a new category
router.post('/categories', categoriesController.createCategory);
// Get edit category form
router.get('/categories/edit/:id', categoriesController.editCategoryForm);
// Update a category
router.post('/categories/edit/:id', categoriesController.updateCategory);
// Toggle category status (list/unlist)
router.post('/categories/islist/:id', categoriesController.toggleCategoryStatus);



// Add products
router.get("/addproducts",productController.loadAddProduct);
router.post("/addproducts",uploads.array("images",4),productController.addProduct);


// products list
router.get("/products",productController.productList);
router.get("/product/block/:id",productController.unListProduct);
router.get("/product/unBlock/:id",productController.listProduct);

// product Edit
router.get("/product/edit/:id",adminMiddleware.isAdmin,productController.loadEditPage)
router.post("/product/edit/:id",uploads.array("images",4),productController.editProduct);
router.post("/product/remove-image",productController.removeImage);


// orders
router.get("/orders",adminMiddleware.isAdmin,orderController.loadOrders);
router.get("/orders/:id",adminMiddleware.isAdmin,orderController.loadOtderDetails);
router.post("/orders/update/:id",orderController.updateOrder);

module.exports = router;



