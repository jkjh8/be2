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
    ttsText: String,
    ttsRate: Number,
    ttsVoice: Object,
    user: String,
    file: Object,
    volume: Number,
    selected: Array,
    active: Boolean,
    color: String,
    startChime: Boolean,
    endChime: Boolean,
    description: String,
  },
  {
    timestamps: true
  }
)

const Schedules = mongoose.model('Schedules', scheduleSchema)
module.exports = Schedules
