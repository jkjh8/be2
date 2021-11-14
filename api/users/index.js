const logger = require('config/logger')
const jwt = require('jsonwebtoken')
const passport = require('passport')
require('dotenv').config()

const Users = require('db/models/users')

function tokens(user) {
  return {
    accessToken: jwt.sign(user, process.env.JWT_SECRET, { expires: '1h' }),
    refreshToken: jwt.sign(user, process.env.JWT_SECRET, { expires: '7d' })
  }
}

module.exports.login = async (req, res) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          return res.status(403).json({ user: user, error: err })
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
        const token = tokens(user)

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
