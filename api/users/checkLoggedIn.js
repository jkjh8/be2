const passport = require('passport')
const logger = require('config/logger')

module.exports.isLoggedIn = (req, res, next) => {
  passport.authenticate('access', { session: false }, (err, user) => {
    if (err) {
      logger.error(`로그인 체크 - 인증 에러 - ${err} `)
      return res.sendStatus(500)
    }
    if (user) {
      req.user = user
      next()
    } else {
      return res.sendStatus(401)
    }
  })(req, res, next)
}

module.exports.isAdmin = (req, res, next) => {
  passport.authenticate('access', { session: false }, (err, user) => {
    if (err) {
      logger.error(`로그인 체크 - 인증 에러 - ${err} `)
      return res.sendStatus(500)
    }
    if (user) {
      if (user.admin) {
        req.user = user
        next()
      } else {
        return res.sendStatus(403)
      }
    } else {
      return res.sendStatus(401)
    }
  })(req, res, next)
}
