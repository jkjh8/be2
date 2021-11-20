const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const serverlogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date },
    level: { type: String },
    message: { type: String },
    meta: { type: String },
    search: { type: String }
  },
  {
    timestamp: true
  }
)
serverlogSchema.index({ '$**': 'text' })
serverlogSchema.plugin(mongoosePaginate)

const Serverlog = mongoose.model('Serverlog', serverlogSchema)

module.exports = Serverlog
