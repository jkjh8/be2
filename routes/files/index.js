const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const files = require('api/files')

router.post('/get', isLoggedIn, files.get)
router.post('/createFolder', isLoggedIn, files.createFolder)
router.post('/delete', isLoggedIn, files.delete)
router.post('/upload', isLoggedIn, files.upload)

module.exports = router
