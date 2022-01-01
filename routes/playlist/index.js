const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const playlist = require('api/playlist')

router.get('/', isLoggedIn, playlist.get)
router.post('/', isLoggedIn, playlist.post)
router.put('/', isLoggedIn, playlist.put)
router.get('/remove', isLoggedIn, playlist.remove)

module.exports = router
