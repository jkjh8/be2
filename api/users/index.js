const logger = require('config/logger')
const jwt = require('jsonwebtoken')
const passport = require('passport')
require('dotenv').config()

const Users = require('db/models/users')

function tokens(user) {
  return {
    access: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' }),
    refresh: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' })
  }
}

module.exports.login = async (req, res) => {
  console.log(req.body)
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

        logger.info(`사용자가 로그인 하였습니다, ${user.email}`)

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
  console.log('refresh', req.headers)
  try {
    const token = tokens({ email: req.user.email })
    res.status(200).json({ token: token })
  } catch (err) {
    logger.error(`토큰 재발행 에러 발생, ${err}`)
  }
}

module.exports.logout = (req, res) => {
  logger.info(`사용자가 로그아웃 하였습니다, ${req.query.user}`)
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
    logger.info(`새로운 사용자가 가입 하였습니다, ${req.body.email}`)
    res.status(200).json({ user: user, token: token })
  } catch (err) {
    logger.error(`회원가입중 에러, ${err}`)
    res.status(500).json({ user: null, error: err })
  }
}

module.exports.users = async (req, res) => {
  try {
    if (req.user.admin) {
      const users = await Users.find({}, { password: 0 })
      res.status(200).json({ users: users })
    } else {
      res.sendStatus(403)
    }
  } catch (error) {
    logger.error(`사용자 조회중 에러 발생, ${error}`)
    res
      .status(500)
      .json({ message: '사용자 조회중 에러가 발생하였습니다', error: error })
  }
}

module.exports.admin = async (req, res) => {
  try {
    if (req.user.admin) {
      const { id, value } = req.query
      const r = await Users.updateOne(
        { _id: id },
        { $set: { admin: value === 'true' ? true : false } }
      )
      res.status(200).json(r)
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    logger.error(`관리자 권한 수정중 에러, ${err}`)
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
    logger.error(`사용자 컬러 변경중 에러 ${err}`)
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
    logger.error(`사용자 등급 수정에러 ${err}`)
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
