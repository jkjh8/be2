const logger = require('config/logger')
const jwt = require('jsonwebtoken')
const passport = require('passport')
require('dotenv').config()

const Users = require('db/models/users')

function tokens(user) {
  return {
    accessToken: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' }),
    refreshToken: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' })
  }
}

module.exports.login = async (req, res) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          return res.status(500).json({ user: user, error: err })
        }

        if (!user) {
          return res.status(403).json({ user: user, info: info })
        }

        // 사용자 정보 업데이트
        await Users.updateOne(
          { _id: user._id },
          {
            $set: { numberOfLogin: user.numberOfLogin + 1, loginAt: Date.now() }
          }
        )
        const token = tokens({ email: user.email })

        // 쿠키 설정
        res.cookie('accessToken', token.accessToken, { httpOnly: true })
        if (req.body.keepLoggedin) {
          res.cookie('refreshToken', token.refreshToken, { httpOnly: true })
        } else {
          res.clearCookie('refreshToken')
        }

        // 사용자정보 전송
        res.status(200).json({ user: user }).end()
      } catch (err) {
        logger.error(`로그인 과정에서 에러 발생, ${err}`)
        res.status(500).json({ user: false, error: err })
      }
    }
  )(req, res)
}

module.exports.get = (req, res) => {
  passport.authenticate('access', { session: false }, (err, user, info) => {
    try {
      if (err) {
        return res.status(500).json({ user: user, error: err })
      }

      if (!user) {
        return res.status(403).json({
          user: user,
          info: info,
          message: '사용자를 찾을 수 없습니다'
        })
      }

      const token = tokens({ email: user.email })
      res
        .cookie('accessToken', token.accessToken, { httpOnly: true })
        .status(200)
        .json({ user: user, info: info })
        .end()
    } catch (err) {
      logger.error(`토큰인증과정에서 에러 발생, ${err}`)
    }
  })(req, res)
}

module.exports.refresh = (req, res) => {
  passport.authenticate('refresh', { session: false }, (err, user, info) => {
    try {
      if (err) {
        return res.status(500).json({ user: user, error: err })
      }

      if (!user) {
        return res.status(403).json({
          user: user,
          info: info,
          message: '사용자를 찾을 수 없습니다'
        })
      }

      const token = tokens({ email: user.email })
      res
        .cookie('accessToken', token.accessToken, { httpOnly: true })
        .cookie('refreshToken', token.refreshToken, { httpOnly: true })
        .status(200)
        .json({ user: user, info: info })
        .end()
    } catch (err) {
      logger.error(`토큰인증과정에서 에러 발생, ${err}`)
    }
  })(req, res)
}

module.exports.logout = (req, res) => {
  req.logout()
  return res
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .status(200)
    .json({ user: null, message: '로그아웃 되었습니다.' })
}
