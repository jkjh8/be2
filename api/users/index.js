const logger = require('config/logger')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const bcrypt = require('bcrypt')
require('dotenv').config()

const Users = require('db/models/users')

function tokens(user) {
  return {
    access: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' }),
    refresh: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' })
  }
}

module.exports.login = async (req, res) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          return res.status(500).json({
            user: user,
            error: err,
            message: '사용자 인증과정에 문제가 발생하였습니다'
          })
        }

        if (!user) {
          return res.status(403).json({ user: user, message: info })
        }

        // 사용자 정보 업데이트
        await Users.updateOne(
          { _id: user._id },
          {
            $set: { numberOfLogin: user.numberOfLogin + 1, loginAt: Date.now() }
          }
        )
        const token = tokens({ email: user.email })
        if (!req.body.keepLoggedIn) {
          delete token.refresh
        }

        logger.info(`사용자 - 로그인 - ${user.email}`)

        // 사용자정보 전송
        res.status(200).json({ user: user, token: token })
      } catch (err) {
        logger.error(`로그인 과정에서 에러 발생, ${err}`)
        res.status(500).json({
          user: false,
          error: err,
          message: '서버 오류가 발생하였습니다'
        })
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
        return res.status(401).json({
          user: user,
          info: info,
          message: '사용자를 찾을 수 없습니다'
        })
      }

      res.status(200).json({ user: user })
    } catch (err) {
      logger.error(`토큰인증과정에서 에러 발생, ${err}`)
    }
  })(req, res)
}

module.exports.refresh = (req, res) => {
  try {
    const token = tokens({ email: req.user.email })
    res.status(200).json({ token: token })
  } catch (err) {
    logger.error(`토큰 재발행 에러 발생, ${err}`)
  }
}

module.exports.logout = (req, res) => {
  logger.info(`사용자 - 로그아웃 - ${req.query.user}`)
  req.logout()
  return res.status(200).json({ user: null, message: '로그아웃 되었습니다.' })
}

module.exports.register = async (req, res) => {
  try {
    let user = await Users.findOne({ email: req.body.email })
    if (user) {
      return res.status(403).json({ message: '이미 가입된 이메일 입니다' })
    }
    user = new Users(req.body)
    await user.save()

    const token = tokens({ email: req.body.email })
    delete token.refresh
    logger.info(`회원가입 - ${req.body.email}`)
    res.status(200).json({ user: user, token: token })
  } catch (err) {
    logger.error(`회원가입 - 에러 - ${err}`)
    res.status(500).json({ user: null, error: err })
  }
}

module.exports.users = async (req, res) => {
  try {
    console.log(req.user)
    if (req.user.admin || req.user.email === 'superuser@superuser.com') {
      // || req.user.email === 'jkjh82@naver.com'
      const users = await Users.find({}, { password: 0 })
      res.status(200).json({ users: users })
    } else {
      res.sendStatus(403)
    }
  } catch (error) {
    logger.error(`사용자 조회 - 에러 - ${error}`)
    res
      .status(500)
      .json({ message: '사용자 조회중 에러가 발생하였습니다', error: error })
  }
}

module.exports.admin = async (req, res) => {
  try {
    if (req.user.admin || req.user.email === 'superuser@superuser.com') {
      const { id, value } = req.query
      const r = await Users.updateOne(
        { _id: id },
        { $set: { admin: value === 'true' ? true : false } }
      )
      res.status(200).json(r)
    } else {
      res.status(403).json({ message: '사용자 권한이 없습니다' })
    }
  } catch (err) {
    logger.error(`관리자 권한 변경 - 서버 에러 - ${err}`)
    res.status(500).json({ message: '서버 에러가 발생하였습니다', error: err })
  }
}

module.exports.color = async (req, res) => {
  try {
    const { email, color } = req.body
    console.log(email, color)
    const r = await Users.updateOne(
      { email: email },
      { $set: { color: color } }
    )
    res.status(200).json(r)
  } catch (err) {
    logger.error(`사용자 컬러 변경 - 서버 에러 - ${err}`)
    res.status(500).json({ error: err, message: '서버 에러가 발생하였습니다.' })
  }
}

module.exports.level = async (req, res) => {
  try {
    const { id, value } = req.query
    console.log(id, value)
    const r = await Users.updateOne(
      { _id: id },
      { $set: { userLevel: Number(value) } }
    )
    res.status(200).json(r)
  } catch (err) {
    logger.error(`사용자 등급 수정 - 서버 에러 - ${err}`)
  }
}

module.exports.delete = async (req, res) => {
  try {
    const { id } = req.query
    const r = await Users.findByIdAndDelete(id)
    res.status(200).json(r)
  } catch (error) {
    logger.error(`사용자 삭제중 에러, ${error}`)
  }
}

module.exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.query
    const r = await Users.find({ email: email })
    if (r && r.length > 0) {
      res
        .status(200)
        .json({ result: false, message: '이미 사용중인 이메일 입니다' })
    } else {
      res
        .status(200)
        .json({ result: true, message: '사용가능한 이메일 입니다.' })
    }
  } catch (err) {
    logger.error(`이메일 중복 확인 - 서버 에러 - ${req.query.email}`)
    res
      .status(500)
      .json({ result: false, message: '서버 오류가 발생하였습니다' })
  }
}

module.exports.changePassword = async (req, res) => {
  try {
    const { email, currentPassword, changePassword } = req.body
    console.log(email)

    const user = await Users.findOne({ email: email })
    if (bcrypt.compareSync(currentPassword, user.password)) {
      const r = await Users.updateOne(
        { email: user.email },
        { $set: { password: changePassword } }
      )
      if (r) {
        logger.info(`사용자 비밀번호 변경 - 완료 - ${email}`)
        return res.status(200).json({
          result: r,
          user: user.email,
          message: '비밀번호가 변경 되었습니다'
        })
      } else {
        logger.error(`사용자 비밀번호 변경 - 에러 - ${user.email}`)
        return res
          .status(403)
          .json({ message: '비밀번호가 변경되지 않았습니다', user: email })
      }
    } else {
      logger.warn(`사용자 비밀번호 변경 - 기존비밀번호 일치 않함 - ${email}`)
      return res
        .status(403)
        .json({ message: '기존 비밀번호가 일치 하지 않습니다' })
    }
  } catch (err) {
    logger.error(`사용자 비밀번호 변경 - 서버에러 - ${req.body.email} ${err}`)
    res.status(500).json({
      error: err,
      message: '비밀번호가 변경되지 않았습니다. -서버에러-'
    })
  }
}
