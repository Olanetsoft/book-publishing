// const mailer = require('../utilities/mail/mail');

//requiring crypto
const crypto = require('crypto');

//get the promisify methods
const { promisify } = require('util');


//using the json web token
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');


//importing error class
const AppError = require('../utils/appError');

//signup user
exports.signup = async (req, res, next) => {
    try {
        //create new user
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt
        });


        //using the jwt to create a signature 
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        });
        //console.log(token)


        //set cookie options
        const cookieOptions = {
            //convert JWT_COOKIE_EXPIRES_IN to millisecond
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true
        };


        //sending cookie to the client
        if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
        res.cookie('jwt', token, cookieOptions);


        //removing the password from the output in response after sign up
        newUser.password = undefined;


        res.status(201).json({
            status: 'success',
            token,
            data: {
                newUser
            }
        });

    } catch (err) {
        console.log(err)
        res.status(400).json({
            status: 'failed',
            message: err
        })
    };

};


//handler for logging in user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        //1.) Check if email and password exist
        if (!email || !password) {
            return next(new AppError('Please provide email and password! 🙄', 400));
        };

        //2.) Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');

        //to compare the entered password and the userPassword
        //const correct = await user.correctPassword(password, user.password);

        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect email or password! 🙄', 401));
        }

        //3.)If everything is fine then send back token to client
        //using the jwt to create a signature 
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        });

        //set cookie options
        const cookieOptions = {
            //convert JWT_COOKIE_EXPIRES_IN to millisecond
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        //sending cookie to the client
        if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
        res.cookie('jwt', token, cookieOptions);

        // if(req.session.oldUrl){
        //     var oldUrl = req.session.oldUrl;
        //     req.session.oldUrl = null;
        //     res.redirect(oldUrl)

        //     // res.status(200).json({
        //     //     status: 'success',
        //     //     token
        //     // });

        // }

        res.status(200).json({
            status: 'success',
            token
        });

    } catch{
        next(new AppError('Unable to login 🙄', 400))
    }

};

//to check if user is logged in
//and only render pages
exports.isLoggedIn = async (req, res, next) => {
    // try {

    if (req.cookies.jwt) {
        try {
            // Verify the token 
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);


            //2.) check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            };


            //3.) check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next()
            };
            req.user = currentUser

            //There is a loggedIn user
            //now use response.local
            res.locals.user = currentUser
            return next();
        } catch (err) {
            return next();
        }
    }

    //Store the old url to check if the login comes from checkout page
    req.session.oldUrl = req.url

    next();
    // } catch (err) {
    //     next(new AppError('failed 😒', 401));
    //     // res.status(400).json({
    //     //     status: 'failed',
    //     //     message: err
    //     // });
    // }
};



//protecting the route against not login user
exports.protectRouteToEnableOnlyLoggedInUser = async (req, res, next) => {
    try {
        let token;

        //1.) Get token and check if it exist
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies.jwt) {
            token = req.cookies.jwt
        };

        //Check if no token in the header and return 401 for non authorized
        if (!token) {
            return next(new AppError('Please Login to get access 😒', 401));
        };


        //2.) Verifying the token and use promisify function by node
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


        //3.) check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exist', 401));
        };


        //4.) check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401))
        };


        //GRANT ACCESS TO ALL PROTECTED ROUTE
        //passing user from middleware to middleware
        req.user = currentUser

        //now use response.local
        res.locals.user = currentUser

        next();

    } catch (err) {
        console.log(err)
        next(new AppError('Token or Authorization failed 😒', 401));
        // res.status(400).json({
        //     status: 'failed',
        //     message: err
        // });
    }
};


