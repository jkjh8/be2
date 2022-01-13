const express = require('express')
const router = express.Router()

const { isLoggedIn, isAdmin } = require('api/users/checkLoggedIn')
const files = require('api/files')

router.post('/get', isLoggedIn, files.get)
router.post('/getFolder', isLoggedIn, files.getFolder)
router.post('/createFolder', isLoggedIn, files.createFolder)
router.post('/delete', isLoggedIn, files.delete)
router.post('/upload', isLoggedIn, files.upload)
router.post('/download', isLoggedIn, files.download)
router.get('/getTree', isLoggedIn, files.getTree)
router.get('/check', isLoggedIn, files.check)
router.get('/deleteTempFolder', isAdmin, files.deleteTemp)
router.get('/getSound', files.getSounds)

module.exports = router
