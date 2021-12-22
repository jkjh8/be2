const Schedules = require('db/models/schedules')
const logger = require('config/logger')
const fs = require('fs')
const path = require('path')

const makeFolder = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

const copyFile = async (source, target) => {
  const rd = fs.createReadStream(source)
  const wr = fs.createWriteStream(target)
  try {
    return await new Promise((resolve, reject) => {
      rd.on('error', reject)
      wr.on('error', reject)
      wr.on('finish', resolve)
      rd.pipe(wr)
    })
  } catch (e) {
    rd.destroy()
    wr.end()
    throw e
  }
}

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
    const { id, file } = req.body

    // move schedule file
    const scheduleFolder = path.join(filesPath, 'schedule', id)
    const scheduleFile = path.join(scheduleFolder, file.name)
    makeFolder(scheduleFolder)
    await copyFile(file.file, scheduleFile)

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
    const { _id, id, file } = req.body

    // move schedule file
    const scheduleFolder = path.join(filesPath, 'schedule', id)
    const scheduleFile = path.join(scheduleFolder, file.name)
    makeFolder(scheduleFolder)
    await copyFile(file.file, scheduleFile)

    const r = await Schedules.updateOne({ _id: _id }, { $set: req.body })
    const zone = zoneToString(req.body.nodes)
    console.log(zone)
    logger.info(`스케줄 - 수정 ${zone}`)
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

function zoneToString(zones) {
  const rt = []
  zones.forEach((parent) => {
    const child = parent.children.map((e) => e.name).join(',')
    rt.push(`${parent.name}: ${child}`)
  })
  return rt
}
