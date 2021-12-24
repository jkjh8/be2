const express = require('express')
const router = express.Router()

const { isAdmin } = require('api/users/checkLoggedIn')
const status = require('api/server')

router.get('/', isAdmin, status.get)

module.exports = router
