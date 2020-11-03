const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

//requiring the cookie parser
const cookieParser = require('cookie-parser');


//import global error class
const AppError = require('./utils/appError');

// //import the global error handler
const globalErrorHandler = require('./controllers/errorController');

//Including session
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

const app = express();


//requiring all routes
const usersRoutes = require('./routes/usersRoute');
const publishRoute = require('./routes/publishRoute');

//Global Middleware registered
//Using morgan only in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};



//using rateLimit
const limiter = rateLimit({
    //set the max depending on your application
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});


//applying the limiter on only the route that starts with /api
app.use('/api', limiter);

//Middleware registered
//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());


app.use(session({
    secret: 'mylongsuperfuckingsecretpleasedontcopy',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(function(req, res, next) {
    req.session.cookie.maxAge = 180 * 60 * 1000; // 3 hours
     next();
 });

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});



//registering the route middleware
app.use(usersRoutes);
app.use(publishRoute);

//Implement a handler to handle all non-existing route
app.all('*', (req, res, next) => {
    // const err = new Error(`Sorry can't find ${req.originalUrl} on the server😫😫`);
    // err.status = 'fail';
    // err.statusCode = 400;
    next(new AppError(`Sorry can't find ${req.originalUrl} on the server😫😫`, 404))
});


//error handling middleware
app.use(globalErrorHandler);


module.exports = app;