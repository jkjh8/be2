const Schedules = require('db/models/schedules')
const logger = require('config/logger')
const { modelNames } = require('mongoose')

module.exports.get = async (req, res) => {
  try {
    const r = await Schedules.find()
    res.status(200).json(r)
  } catch (e) {
    res.sendStatus(500)
  }
}

module.exports.add = async (req, res) => {
  try {
    const schedule = new Schedules({
      ...req.body
    })
    const r = await schedule.save()
    logger.info(`스케줄 - 등록 ${req.body.toString()}`)
    res.status(200).json(r)
  } catch (e) {
    logger.error(`스케줄 - 등록 에러 ${e.message}`)
    res.sendStatus(500)
  }
}

module.exports.update = async (req, res) => {
  try {
    const schedule = req.body
    const r = await Schedules.updateOne(
      { _id: schedule._id },
      { $set: schedule }
    )
    logger.info(`스케줄 - 수정 ${req.body.toString()}`)
    res.status(200).json(r)
  } catch (e) {
    logger.error(`스케줄 - 수정 에러 ${e.message}`)
    res.sendStatus(500)
  }
}

module.exports.active = async (req, res) => {
  try {
    const { id, value } = req.query
    const { email } = req.user
    await Schedules.updateOne({ id: id }, { $set: { active: value } })
    logger.info(
      `스케줄 변경 - 동작상태 - user: ${email} id: ${id}, value: ${value}`
    )
    res.sendStatus(200)
  } catch (e) {
    logger.error(
      `스케줄 변경 - 동작상태 - user: ${user.email} id: ${req.query.id}`
    )
  }
}
