const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('api/users/checkLoggedIn')
const functions = require('api/users')

router.get('/', isLoggedIn, functions.users)
router.get('/delete', isLoggedIn, functions.delete)
router.get('/admin', isLoggedIn, functions.admin)

module.exports = router
