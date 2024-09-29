const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const productController = require("../controllers/productsController");
const multer = require('multer');
const storage = require("../config/multer");
const uploads = multer({storage : storage});
const categoriesController = require("../controllers/categoriesController");

// login routes
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.adminLogin);


// dashboard route
router.get('/',adminController.dashboardLoad);


// logout
router.get('/logout',adminController.Logout);
// userList
router.get('/users',userController.userList);
// Block user
router.get('/user/block/:id',userController.userBlock);
// unBlock user
router.get("/user/unblock/:id",userController.userUnBlock);




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

module.exports = router;