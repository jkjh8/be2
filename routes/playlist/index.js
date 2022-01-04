const express = require('express')
const router = express.Router()

const { isLoggedIn } = require('api/users/checkLoggedIn')
const playlist = require('api/playlist')

router.get('/', isLoggedIn, playlist.get)
router.post('/', isLoggedIn, playlist.post)
router.put('/', isLoggedIn, playlist.put)
router.get('/delete', isLoggedIn, playlist.remove)
router.post('/addListItem', isLoggedIn, playlist.addListItem)
router.get('/removeListItem', isLoggedIn, playlist.removeListItem)

module.exports = router
