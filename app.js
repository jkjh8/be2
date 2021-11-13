const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const httpLogger = require('morgan')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')

const app = express()

// socket.io 생성
app.io = require('socket.io')()

app.use(httpLogger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
