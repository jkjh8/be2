const express = require('express')
const router = express.Router()

const fnAuth = require('api/users')

router.post('/login', fnAuth.login)
router.get('/login', fnAuth.get)
router.get('/refresh', fnAuth.refresh)

router.get('/logout', fnAuth.logout)
module.exports = router
