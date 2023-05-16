const User = require('../models/User')
const {StatusCodes} = require('http-status-codes')
const jwt = require('jsonwebtoken')

//register route that creates user, hashes password, and creates web token
const register = async (req, res) => {
    try {
    const user = await User.create({ ...req.body }) 
    const token = user.createJWT()
    res.cookie('token', token, {sameSite:'none', secure:true}).status(StatusCodes.CREATED).json({user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`, 
        username: user.username 
    }})
    }
    catch (error) {
        //check for duplicate email or username
        if (error.code === 11000) {
            let errOutput = {}
            const errList = Object.keys(error.keyValue)
            errList.forEach((cur) => {
                errOutput = {...errOutput, [cur]: 
                    {message: `The ${cur} ${cur === 'email' ? error.keyValue.email : error.keyValue.username} is already in use.`,
                    errorType: cur,}
                }
            })
            res.status(StatusCodes.BAD_REQUEST).json({error: errOutput})
        } else {
            // lets do firstname/lastname/username/password/email validation here
            let errOutput = {}
            const errList = Object.keys(error.errors)
            errList.forEach((cur) => {
                if (cur === "password") {
                    errOutput = {...errOutput, [cur]: {message: 'Invalid password must be at least 6 characters', errorType: cur}}
                } else {
                    errOutput = {...errOutput, [cur]: {message: error.errors[cur].message, errorType: cur}}
                }
            })

            res.status(StatusCodes.BAD_REQUEST).json({error: errOutput})
        }
        console.log(error)
    }
}

const profile = async (req, res) => {
    try {
        const token = req.cookies?.token
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_SECRET)
            // console.log('Token is valid')
            res.status(StatusCodes.ACCEPTED).json({user: {userId: payload.userId, name: payload.name, username: payload.username }}) 
        } else {
            res.status(StatusCodes.NOT_FOUND).json({error: `No token is found`}) 
        }
      } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({error: `Authentication invalid`})
      }
}

const login = async (req, res) => {
    try{
        const { username, password } = req.body

        if (!username) {
            res.status(StatusCodes.BAD_REQUEST).json({error: {'username': {message: 'Missing username', errorType: 'username'}}})
        }
        if (!password) {
            res.status(StatusCodes.BAD_REQUEST).json({error: {'password': {message: 'Missing password', errorType: 'password'}}})
        }

        const user = await User.findOne({ username })

        if (!user) {
            res.status(StatusCodes.UNAUTHORIZED).json({error: {'auth': {message: `No user found with username ${username}`, errorType: 'auth'}}})
        }
        
        const isPasswordCorrect = await user.comparePassword(password)
        if (!isPasswordCorrect) {
        res.status(StatusCodes.UNAUTHORIZED).json({error: {'password': {message: 'Incorrect password', errorType: 'password'}}})
        }
        
        const token = user.createJWT()
        res.cookie('token', token, {sameSite:'none', secure:true}).status(StatusCodes.OK).json({user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`, 
            username: user.username 
        }})
    }catch(error) {
        if (!res.headersSent) {
            res.status(StatusCodes.UNAUTHORIZED).json({error: {'auth': {message: 'Invalid Authentication', errorType: 'auth'}}})
        }
    }
}

const allUsers = async (req, res) => {
    try {
        // res.json('hello there')
        const users = await User.find({}, {'_id': 1, 'username': 1, 'firstName': 1, 'lastName': 1})
        // console.log(users)
        res.status(StatusCodes.OK).json(users) 
    } catch (error) {
        res.status(StatusCodes.CONFLICT).json({error: `Error finding all users`})
    }
}

const logout = (req, res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).status(StatusCodes.OK).json('OK')
}


module.exports = {
    register,
    login,
    profile,
    allUsers,
    logout,
}