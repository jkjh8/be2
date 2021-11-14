const express = require('express')
const router = express.Router()

const fnAuth = require('api/users')

router.post('/login', fnAuth.login)
module.exports = router
