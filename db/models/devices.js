const mongoose = require('mongoose')

const devicesSchema = new mongoose.Schema(
  {
    index: Number,
    name: String,
    ipaddress: { type: String, required: true },
    devicetype: String,
    detail: Object,
    mode: String,
    pageid: Number,
    channels: {
      type: Number,
      min: 1,
      max: 32
    },
    parent: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Devices'
    },
    channel: {
      type: Number,
      min: 1,
      max: 32
    },
    children: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Devices'
      }
    ],
    gain: [
      {
        type: Number,
        min: -100,
        max: 20
      }
    ],
    mute: [{ type: Boolean }],
    active: [{ type: Boolean }],
    activeCount: { type: Number, default: 0 },
    status: {
      type: Boolean,
      default: false,
      required: true
    },
    failedAt: Date
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Devices', devicesSchema)
