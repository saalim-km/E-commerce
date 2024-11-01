const express = require('express');
const router = express.Router();

// controllers
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const productController = require("../controllers/productsController");
const orderController = require("../controllers/orderController");
const categoriesController = require("../controllers/categoriesController");
const couponController = require("../controllers/couponController");
const salesRepController = require("../controllers/reportController");

// middleware
const adminMiddleware = require("../middlewares/isAdmin");

// configurations
const multer = require('multer');
const storage = require("../config/multer");
const uploads = multer({storage});


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
router.post("/addproducts",uploads.array('images'),productController.addProduct);


// products list
router.get("/products",productController.productList);
router.get("/product/block/:id",productController.unListProduct);
router.get("/product/unBlock/:id",productController.listProduct);

// product Edit
router.get("/product/edit/:id",adminMiddleware.isAdmin,productController.loadEditPage)
router.post("/product/edit/:id",uploads.array('images'),productController.editProduct);
router.post("/product/remove-image",productController.removeImage);


// orders
router.get("/orders",adminMiddleware.isAdmin,orderController.loadOrders);
router.get("/orders/:id",adminMiddleware.isAdmin,orderController.loadOtderDetails);
router.post("/orders/update/:id",orderController.updateOrder);


// product offer 
router.get("/add_offer",adminMiddleware.isAdmin,productController.addOfferPage);
router.post("/add_offer/:id",productController.addOffer)

// avtivate && de_activate offer
router.post("/deactivate_offer/:id",productController.deactivate_offer);
router.post("/activate_offer/:id",productController.activate_offer);



// category offer
router.get("/categoryOffer",adminMiddleware.isAdmin,categoriesController.categoryOffer);
router.post("/add_category_offer/:id",categoriesController.addOffer);

// activate / de-activate category offer
router.post('/deactivate_category_offer/:id',categoriesController.deactivateOffer);
router.post('/activate_category_offer/:id' ,categoriesController.activateOffer);

// coupon
router.get("/coupon",adminMiddleware.isAdmin,couponController.couponPage);
router.post("/coupons/create",couponController.addCoupon);
router.delete('/coupon/delete',couponController.deleteCoupon)


// sales report
router.get("/salesReport",adminMiddleware.isAdmin,salesRepController.reportPage);
router.post('/sales-report', salesRepController.filterSalesReport);

router.get("/sales-report/download",salesRepController.downloadSalesReportPdf);
module.exports = router;



