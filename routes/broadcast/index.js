const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const broadcast = require('api/broadcast')

router.use('/schedule', require('./schedule'))

router.get('/pagePreset', isLoggedIn, broadcast.getPreset)
router.post('/pagePreset', isLoggedIn, broadcast.savePreset)

module.exports = router
