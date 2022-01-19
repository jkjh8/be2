const Schedules = require('db/models/schedules')
const eventlog = require('api/eventlog')
const logger = require('config/logger')
const fs = require('fs')
const path = require('path')
const moment = require('moment')

const fnBroadcast = require('api/broadcast')

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
    const { _id, repeat, date, week, time, id, file, nodes } = req.body
    let dup
    let error = false
    switch (repeat) {
      case '매일':
        dup = await Schedules.find({ time: time })
        if (dup.length) {
          error = true
        }
        break
      case '한번':
        dup = await Schedules.find({
          time: time,
          date: date
        })
        console.log(dup)
        if (dup.length) {
          error = true
        }
        break
      case '매주':
        wday = []
        dup = await Schedules.find({ time: time })
        for (let i = 0; i < dup.length; i++) {
          if (dup[i].repeat === '매일' || dup[i].repeat === '한번') {
            error = true
            break
          }
          dup[i].week.forEach((item) => {
            week.forEach((wday) => {
              if (item.value === wday.value) {
                error = true
              }
            })
          })
        }
        break
    }
    if (error) {
      console.error(error)
      return res.status(403).json({
        message: '스케줄 중복',
        caption: '동일시간에 다른 스케줄이 존재합니다'
      })
    }

    // move schedule file
    const scheduleFolder = path.join(filesPath, 'schedule', id)
    const scheduleFile = path.join(scheduleFolder, file.name)
    makeFolder(scheduleFolder)
    await copyFile(file.file, scheduleFile)

    const schedule = new Schedules({
      ...req.body
    })
    const r = await schedule.save()

    // 로그
    logger.info(`스케줄 - 등록 ${JSON.stringify(req.body)}`)
    eventlog.info({
      source: req.user.email,
      id: id,
      zones: nodes,
      message: `스케줄 등록 - ${req.body.name}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`스케줄 - 등록 에러 ${e}`)
    eventlog.error({
      source: req.user.email,
      id: req.body.id,
      message: `스케줄 등록 에러 ${req.body.name}`
    })
    res.sendStatus(500)
  }
}

module.exports.update = async (req, res) => {
  try {
    const { _id, repeat, date, week, time, id, file, nodes } = req.body
    let dup
    let error = false
    switch (repeat) {
      case '매일':
        dup = await Schedules.find({ time: time, _id: { $ne: _id } })
        if (dup.length) {
          error = true
        }
        break
      case '한번':
        dup = await Schedules.find({
          time: time,
          date: date,
          _id: { $ne: _id }
        })
        if (dup.length) {
          error = true
        }
        break
      case '매주':
        wday = []
        dup = await Schedules.find({ time: time, _id: { $ne: _id } })
        for (let i = 0; i < dup.length; i++) {
          if (dup[i].repeat === '매일' || dup[i].repeat === '한번') {
            error = true
            break
          }
          dup[i].week.forEach((item) => {
            week.forEach((wday) => {
              if (item.value === wday.value) {
                error = true
              }
            })
          })
        }
        break
    }
    if (error) {
      return res.status(403).json({
        message: '스케줄 중복',
        caption: '동일시간에 다른 스케줄이 존재합니다'
      })
    }

    // move schedule file
    const scheduleFolder = path.join(filesPath, 'schedule', id)
    const scheduleFile = path.join(scheduleFolder, file.name)
    makeFolder(scheduleFolder)
    await copyFile(file.file, scheduleFile)

    const r = await Schedules.updateOne({ _id: _id }, { $set: req.body })

    logger.info(`스케줄 - 수정 ${JSON.stringify(req.body)}`)
    eventlog.info({
      source: req.user.email,
      id: id,
      zones: nodes,
      message: `스케줄 수정 - ${req.body.name}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`스케줄 - 수정 에러 ${e.message}`)
    eventlog.error({
      source: req.user.email,
      id: req.body.id,
      message: `스케줄 수정 에러 ${req.body.name}`
    })
    res.sendStatus(500)
  }
}

module.exports.delete = async (req, res) => {
  try {
    const { id } = req.query
    const email = req.user
    await Schedules.deleteOne({ _id: id })
    logger.info(`스케줄 삭제 - user: ${email}, id: ${id}`)

    eventlog.info({
      source: req.user.email,
      id: id,
      message: '스케줄 삭제'
    })
    res.sendStatus(200)
  } catch (e) {
    logger.error(`스케줄 삭제 - 에러 ${e}`)
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
    eventlog.info({
      source: req.user.email,
      id: id,
      message: `스케줄 동작 상태 변경 - ${value}`
    })
    res.sendStatus(200)
  } catch (e) {
    logger.error(
      `스케줄 변경 - 동작상태 - user: ${user.email} id: ${req.query.id}`
    )
  }
}

module.exports.parcing = async () => {
  const now = moment()
  const date = moment(now).format('YYYY-MM-DD')
  const time = moment(now).format('HH:mm')
  const week = moment(now).weekday()
  console.log(date, time, week)
  const schedule = await Schedules.findOne({ time: time })
  if (schedule.active) {
    if (schedule.repeat === '매일') {
      startOnairSchedule(schedule)
      return console.log('스케줄 매일')
    } else if (schedule.repeat === '한번') {
      if (schedule.date == date) {
        startOnairSchedule(schedule)
        return console.log('스케줄 한번')
      }
    } else if (schedule.repeat === '매주') {
      for (let i = 0; i < schedule.week.length; i++) {
        if (schedule.week[i] == week) {
          startOnairSchedule(schedule)
          console.log('스케줄 매주')
          break
        }
      }
    }
  }
}

const startOnairSchedule = async (schedule) => {
  const command = { key: 'schedule', ...schedule._doc }

  await fnBroadcast.onair(command)
  app.multicast.send(JSON.stringify(command), 12300, app.multicastAddress)
}
// function zoneToString(zones) {
//   const rt = []
//   zones.forEach((parent) => {
//     const child = parent.children.map((e) => e.name).join(',')
//     rt.push(`${parent.name}: ${child}`)
//   })
//   return rt
// }
