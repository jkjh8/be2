const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const devices = require('api/devices')

router.get('/', isLoggedIn, devices.get)
router.post('/', isLoggedIn, devices.post)

module.exports = router
