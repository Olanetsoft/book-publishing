//requiring crypto
const crypto = require('crypto');

//get the promisify methods
const { promisify } = require('util');


//using the json web token
const jwt = require('jsonwebtoken');
const Publish = require('../models/publishModel');



//importing error class
const AppError = require('../utils/appError');

//generate pin 
exports.generatePin = async (req, res, next) => {
    try {
        //create new user
        const newBook = await Publish.create({
            name: req.body.name,
        });


      
        res.status(201).json({
            status: 'success',
            data: {
                newBook
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