const express = require('express')
const router = express.Router()

const { isLoggedIn, isAdmin } = require('api/users/checkLoggedIn')
const broadcast = require('api/broadcast')

router.use('/schedule', require('./schedule'))

router.get('/pagePreset', isLoggedIn, broadcast.getPreset)
router.post('/pagePreset', isLoggedIn, broadcast.savePreset)
router.post('/onended', broadcast.onEnded)
router.get('/cancelAll', isAdmin, broadcast.cancelAll)

module.exports = router
