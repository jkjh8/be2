const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const files = require('api/files')

router.post('/get', files.get)
router.post('/createFolder', isLoggedIn, files.createFolder)
router.post('/delete', isLoggedIn, files.delete)

module.exports = router
