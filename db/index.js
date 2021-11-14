const mongoose = require('mongoose')
const logger = require('config/logger')

mongoose.connect('mongodb://localhost:27017/mediaserver', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true,
  connectTimeoutMS: 1000
})

const db = mongoose.connection

db.once('open', () => {
  logger.info('Database connected!')
})

db.on('error', () => {
  logger.error('Database connection error!')
})

module.exports = db
