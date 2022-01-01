const mongoose = require('mongoose')

const playlistSchema = new mongoose.Schema(
  {
    name: String,
    user: String,
    list: Array
  },
  {
    timestamps: true
  }
)

const Playlists = mongoose.model('Playlists', playlistSchema)
module.exports = Playlists
