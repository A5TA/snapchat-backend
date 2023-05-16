const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const currentYear = new Date().getFullYear()

const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide firstname'],
        minlength: 2,
        maxlength: 50,
    }, 
    lastName: {
        type: String,
        required: [true, 'Please provide lastname'],
        minlength: 2,
        maxlength: 50,
    }, 
    username: {
        type: String,
        required: [true, 'Please provide username'],
        minlength: 3,
        maxlength: 50,
        unique: true,
    }, 
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide valid email'
        ],
        unique: true,
    },
    birthday: {
        day: { 
            type: Number,
            required: [true, 'Please provide birth day'], 
            min: 1,
            max: 31
        },
        month: { 
            type: String,
            required: [true, 'Please provide birth month'], 
            enum: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ]
        },
        year: { 
            type: Number,
            required: [true, 'Please provide year of birth'], 
            min: 1900,
            max: currentYear,
        },
     }
})

UserSchema.pre('save', async function () {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  })

UserSchema.methods.createJWT = function() {
    return jwt.sign({userId: this._id, username: this.username, name: `${this.firstName} ${this.lastName}`}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME
    })
}

UserSchema.methods.comparePassword = async function (canditatePassword) {
    const isMatch = await bcrypt.compare(canditatePassword, this.password)
    return isMatch
  }

module.exports = mongoose.model('User', UserSchema)