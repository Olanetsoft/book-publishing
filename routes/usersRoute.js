const express = require('express');
const router = express.Router();


//import user controller
// const userController = require('../controllers/usersController');

//import auth controller
const authController = require('../controllers/authController');



router.post('/api/v1/users/login', authController.login);

router.post('/api/v1/users/signup', authController.signup);


module.exports = router;