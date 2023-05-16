const express = require('express')
const router = express.Router()

const {login, register, profile, allUsers,logout} = require('../controllers/auth')

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/profile').get(profile)
router.route('/allUsers').get(allUsers)
router.route('/logout').post(logout)

module.exports = router