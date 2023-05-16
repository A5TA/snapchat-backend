const mongoose = require('mongoose')


const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'There is no sender provided'],
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'There is no sender recipient'],
    },
    text: {
        type: String,
    },
    file: {
        data: String,
        fileName: String
      },
    snap: {
        data: String,
        fileName: String
    }
}, {timestamps: true})


module.exports = mongoose.model('Message', MessageSchema)