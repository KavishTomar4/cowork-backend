let mongoose = require('mongoose')

//User Schema for strong user credentials in database
let user = mongoose.Schema({

    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    projects: [{
            type: String
    
    }]
    

})

module.exports = mongoose.model('User', user)