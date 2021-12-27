// app 절대경로 지정
require('app-module-path').addPath(__dirname)

const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const httpLogger = require('morgan')
const fileupload = require('express-fileupload')
const cron = require('node-cron')

const logger = require('config/logger')
const eventlog = require('api/eventlog')

const indexRouter = require('./routes/index')
const apiRouter = require('./routes/api')

const app = express()
// CORS
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, origin)
    },
    credentials: true
  })
)
// database connect
app.db = require('./db')
// socket.io 생성
app.io = require('socket.io')()
require('api/socketio')(app)
// mulcast server 생성
app.multicastAddress = '230.185.192.12'
app.multicastPort = 12340
require('config/multicast')(app)

// passport
const passport = require('passport')
const passportConfig = require('api/passport')
passportConfig()
app.use(passport.initialize())

// fileupload
app.use(fileupload())

app.use(httpLogger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// router
app.use('/', indexRouter)
app.use('/api', apiRouter)

logger.info('Server start!')
eventlog.info({ message: '미디어 서버가 시작하였습니다' })

// file
function makeFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }
}
global.filesPath = path.join(__dirname, 'files')
global.tempPath = path.join(__dirname, 'files', 'Temp')
makeFolder(filesPath)
makeFolder(path.join(filesPath, 'Media'))
makeFolder(path.join(filesPath, 'Schedule'))
makeFolder(path.join(filesPath, 'Temp'))

app.use('/files', express.static(filesPath))
app.use('/media', express.static(path.join(filesPath, 'Media')))

// cron
const deviceApi = require('api/devices')
const Devices = require('db/models/devices')
cron.schedule('*/1 * * * *', async () => {
  try {
    console.log('갱신')
    await deviceApi.getStatusDevice()
    app.io.emit('devices')
  } catch (e) {
    console.error(e.message)
  }
})
const schedule = require('api/schedule')
cron.schedule('*/1 * * * *', async () => {
  await schedule.get()
  await deviceApi.getStatusPA()
})

module.exports = app
