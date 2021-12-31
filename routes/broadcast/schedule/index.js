const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const schedule = require('api/broadcast/schedule')

router.get('/', isLoggedIn, schedule.get)
router.post('/', isLoggedIn, schedule.add)
router.put('/', isLoggedIn, schedule.update)
router.get('/active', isLoggedIn, schedule.active)
router.get('/delete', isLoggedIn, schedule.delete)

module.exports = router
