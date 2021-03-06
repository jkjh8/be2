const express = require('express')
const router = express.Router()
const { isAdmin } = require('api/users/checkLoggedIn')
const systemlog = require('api/systemlog')

router.get('/', isAdmin, systemlog.get)

module.exports = router
