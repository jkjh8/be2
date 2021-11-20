const passport = require('passport')
const logger = require('config/logger')

module.exports.isLoggedIn = (req, res, next) => {
  passport.authenticate('access', { session: false }, (err, user) => {
    try {
      if (err) {
        logger.error(`로그인 체크 - 인증 에러 - ${err} `)
        return res.status(500).redirect('/').send('server error')
      }
      if (user) {
        req.user = user
        next()
      } else {
        res.status(401).redirect('/').send('no Tokens')
      }
    } catch (err) {
      logger.error(`로그인 체크 - 서버 에러 - ${err}`)
    }
  })(req, res, next)
}
