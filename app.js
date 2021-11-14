// app 절대경로 지정
require('app-module-path').addPath(__dirname)

const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const httpLogger = require('morgan')
const logger = require('config/logger')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')

const app = express()
// database connect
app.db = require('./db')
// socket.io 생성
app.io = require('socket.io')()
// mulcast server 생성
app.multicastAddress = '230.185.192.12'
app.multicastPort = 12340
require('config/multicast')(app)

app.use(httpLogger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)

logger.info('Server start!')

module.exports = app
