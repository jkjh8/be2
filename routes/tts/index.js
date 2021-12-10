const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('api/users/checkLoggedIn')
const tts = require('api/TTS')

router.get('/', isLoggedIn, tts.getInfo)
router.post('/preview', isLoggedIn, tts.preview)

module.exports = router
