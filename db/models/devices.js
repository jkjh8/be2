const mongoose = require('mongoose')

const devicesSchema = new mongoose.Schema(
  {
    index: { type: Number },
    name: { type: String },
    ipaddress: { type: String, required: true },
    devicetype: { type: String },
    detail: { type: Object, default: {}, required: true },
    mode: { type: String },
    channels: { type: Number },
    parent: { type: String },
    channel: { type: Number },
    children: { type: Array },
    gain: { type: Array },
    mute: { type: Array },
    active: { type: Array },
    auth: { type: Array },
    status: { type: Boolean, default: false, required: true },
    failedAt: { type: Date },
    search: { type: String }
  },
  {
    timestamps: true
  }
)

const Devices = mongoose.model('Devices', devicesSchema)

module.exports = Devices
