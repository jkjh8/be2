const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('api/users/checkLoggedIn')
const systemlog = require('api/systemlog')

router.get('/', isLoggedIn, systemlog.get)

module.exports = router
