const mongoose = require('mongoose')

const pagePresetSchema = new mongoose.Schema(
  {
    name: String,
    nodes: Array,
    selected: Array,
    type: String,
    user: String,
    mode: String,
    file: Object,
    volume: { type: Number, default: 70 },
    startChime: { type: Boolean, default: false }
  },
  {
    timestamp: true
  }
)

const PagePreset = mongoose.model('pagePreset', pagePresetSchema)

module.exports = PagePreset
