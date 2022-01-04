const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    repeat: String,
    mode: String,
    time: String,
    date: String,
    dateValue: Date,
    week: Array,
    user: String,
    file: Object,
    playlist: Object,
    volume: Number,
    nodes: Array,
    selected: Array,
    active: Boolean,
    color: String,
    startChime: Boolean,
    endChime: Boolean,
    description: String
  },
  {
    timestamps: true
  }
)

const Schedules = mongoose.model('Schedules', scheduleSchema)
module.exports = Schedules
