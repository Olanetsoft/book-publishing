const mongoose = require('mongoose');
const validator = require('validator');

const publishSchema = new mongoose.Schema({
  numberOfBooks: {
        type: String,
        required: [true, 'please tell us the number of book to be published'],
    }

});


//define the Publish Model
const Publish = mongoose.model('Publish', publishSchema);

module.exports = Publish;