const express = require('express')
const router = express.Router()

const files = require('api/files')

router.post('/get', files.get)

module.exports = router
