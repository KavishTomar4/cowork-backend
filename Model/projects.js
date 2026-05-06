let mongoose = require('mongoose')

//User Schema for strong user credentials in database
let project = mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    members: [
        {
            type: String,
            ref: 'user'
        }
    ],
    content: {
        type: String
    }

})

module.exports = mongoose.model('Projects', project)