const express = require('express')
const router = express.Router()

const {getMessages, deleteMessage, createMessage} = require('../controllers/messages')

router.route('/:id').get(getMessages).delete(deleteMessage)
router.route('/').post(createMessage)

module.exports = router