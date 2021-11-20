const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const eventlog = require('api/eventlog')

router.get('/', isLoggedIn, eventlog.get)

module.exports = router
