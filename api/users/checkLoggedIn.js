const passport = require('passport')
const logger = require('config/logger')

module.exports.isLoggedIn = (req, res, next) => {
  passport.authenticate('access', { session: false }, (err, user) => {
    try {
      if (err) {
        return res.status(500).redirect('/').send('server error')
      }
      if (user) {
        req.user = user
        next()
      } else {
        res.status(401).redirect('/').send('user not login')
      }
    } catch (err) {
      logger.error(`로그인 체크 에러, ${err}`)
    }
  })(req, res, next)
}
