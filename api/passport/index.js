const logger = require('config/logger')

const passport = require('passport')
const bcrypt = require('bcrypt')
require('dotenv').config()

const Users = require('db/models/users')
const JWTStrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt
const LocalStrategy = require('passport-local').Strategy

const localOption = {
  usernameField: 'email',
  passwordField: 'password'
}

const jwtOption = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

async function localVerify(email, password, done) {
  try {
    // 사용자 찾기
    const user = await Users.findOne({ email: email }, { _id: 0 })
    if (!user) {
      return done(null, false, '사용자를 찾을 수 없습니다.')
    }
    // 비밀번호 검증
    if (bcrypt.compareSync(password, user.password)) {
      delete user.password
      return done(null, user, '로그인 성공 하였습니다.')
    } else {
      return done(null, false, '패스워드가 일치 하지 않습니다.')
    }
  } catch (err) {
    logger.error(`사용장 인증 에러 Local, ${err}`)
    done(null, false, {
      message: '사용자 인증 과정에서 장애가 발생하였습니다.'
    })
  }
}

async function jwtVerify(payload, done) {
  try {
    const user = await Users.findOne(
      { email: payload.email },
      { _id: 0, password: 0 }
    )
    if (!user) {
      return done(null, false, '사용자를 찾을 수 없습니다')
    }
    done(null, user, '로그인 성공 JWR')
  } catch (err) {
    logger.error(`사용자 인증 에러 JWT ${err}`)
    done(null, false, '사용자 인증과정에 장애가 발생하였습니다.')
  }
}

module.exports = () => {
  passport.use('local', new LocalStrategy(localOption, localVerify))
  passport.use('access', new JWTStrategy(jwtOption, jwtVerify))
}
