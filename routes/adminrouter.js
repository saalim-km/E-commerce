const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');

// login routes
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.adminLogin);

// dashboard route
router.get('/',adminController.dashboardLoad);

// logout
router.get('/logout',adminController.Logout);

// userList
router.get('/users',userController.userList);

module.exports = router;