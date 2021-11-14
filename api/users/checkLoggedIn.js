const passport = require('passport')

module.exports.isLoggedIn = (req, res, next) => {
  passport.authenticate('access', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).redirect('/').send('server error')
    }
    if (user) {
      req.user = user
      next()
    } else {
      res.status(403).redirect('/').send('user not login')
    }
  })(req, res, next)
}
