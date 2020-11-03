const express = require('express');
const router = express.Router();

//import auth controller
const authController = require('../controllers/authController');


//import publish controller
const publishController = require('../controllers/authController');

//router.post('/api/v1/publish/create', authController.protectRouteToEnableOnlyLoggedInUser, publishController.generatePin);


module.exports = router;