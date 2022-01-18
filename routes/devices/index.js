const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const devices = require('api/devices')

router.get('/', isLoggedIn, devices.get)
router.post('/', isLoggedIn, devices.post)
router.put('/', isLoggedIn, devices.put)
router.get('/parent', isLoggedIn, devices.getParent)
router.get('/delete', isLoggedIn, devices.delete)

router.get('/checkChannel', isLoggedIn, devices.checkChannel)
router.post('/checkChild', isLoggedIn, devices.checkChild)
router.get('/addChild', isLoggedIn, devices.addChild)
router.put('/updateMasterChannel', isLoggedIn, devices.updateMasterChannel)
router.put('/updateChildChannel', isLoggedIn, devices.updateChildChannel)

router.get('/refresh', isLoggedIn, devices.refresh)
router.get('/refreshPa', isLoggedIn, devices.refreshPa)
router.get('/cancel', isLoggedIn, devices.cancel)
router.put('/volume', isLoggedIn, devices.volume)

module.exports = router
