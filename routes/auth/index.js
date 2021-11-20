const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')

const fnAuth = require('api/users')

router.post('/register', fnAuth.register)
router.post('/login', fnAuth.login)
router.get('/login', fnAuth.get)
router.get('/refresh', isLoggedIn, fnAuth.refresh)
router.get('/logout', fnAuth.logout)
router.get('/checkEmail', fnAuth.checkEmail)
module.exports = router
