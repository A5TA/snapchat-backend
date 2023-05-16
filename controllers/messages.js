const Message = require('../models/Message')
const jwt = require('jsonwebtoken')
const {StatusCodes} = require('http-status-codes')

const getMessages = async (req, res) => {
    
    try {
        const userId = req.params.id
        const token = req.cookies?.token
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_SECRET)
            
            const messages = await Message.find({recipient: {$in:[payload.userId, userId]} , sender: {$in:[payload.userId, userId]} }).sort({createdAt: 1})
            res.status(StatusCodes.OK).json({messages: messages}) 
        } else {
            res.status(StatusCodes.NOT_FOUND).json({error: `No token is found`}) 
        }
        
        
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({error: `Unable to provide Messages with Invalid Credentials`})
    }
}

const createMessage = async (req, res) => {
    try {
        const token = req.cookies?.token
        const {recipient, text, file, snap} = req.body
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const message = await Message.create({
                sender: payload.userId,
                recipient: recipient,
                text,
                file: file ? {
                    data: file?.data,
                    fileName: file?.fileName
                } : null,
                snap: snap ? {
                    data: snap,
                    fileName: `${Date.now()}.webm`,
                } : null,
            })
            
            res.status(StatusCodes.CREATED).json({message: message})
        } else {
            res.status(StatusCodes.NOT_FOUND).json({error: `No token is found`}) 
        }

    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({error: `Unable to delete a Message with Invalid ID`})
    }
}


const deleteMessage = async (req, res) => {
    try {
        const userId = req.params.id
        const token = req.cookies?.token
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_SECRET)
            
            const messages = await Message.deleteOne({_id: userId, sender: payload.userId})
            res.status(StatusCodes.OK).json('Deleted message') 
        } else {
            res.status(StatusCodes.NOT_FOUND).json({error: `No token is found`}) 
        }
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({error: `Unable to delete a Message with Invalid ID`})
    }
}

module.exports = {
    getMessages,
    deleteMessage,
    createMessage
}