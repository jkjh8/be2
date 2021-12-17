const mongoose = require('mongoose')

const broadcastSchema = new mongoose.Schema(
  {
    id: { type: String },
    zones: { type: Array },
    state: { type: Boolean }
  },
  {
    timestamp: true
  }
)

const Broadcast = mongoose.model('broadcast', broadcastSchema)

module.exports = Broadcast
