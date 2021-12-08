const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/users', require('./users'))
router.use('/files', require('./files'))
router.use('/eventlog', require('./eventlog'))
router.use('/systemlog', require('./systemlog'))
router.use('/devices', require('./devices'))
router.use('/tts', require('./tts'))
module.exports = router
