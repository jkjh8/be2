const Schedules = require('db/models/schedules')
const logger = require('config/logger')
const fs = require('fs')
const path = require('path')
const moment = require('moment')

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
    const { _id, repeat, date, week, time, id, file } = req.body
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
    logger.info(`스케줄 - 등록 ${JSON.stringify(req.body)}`)
    res.status(200).json(r)
  } catch (e) {
    logger.error(`스케줄 - 등록 에러 ${e.message}`)
    res.sendStatus(500)
  }
}

module.exports.update = async (req, res) => {
  try {
    const { _id, repeat, date, week, time, id, file } = req.body
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

module.exports.parcing = async () => {
  const now = moment()
  const date = moment(now).format('YYYY-MM-DD')
  const time = moment(now).format('hh:mm')
  const week = moment(now).weekday()
  console.log(date, time, week)
  const schedules = await Schedules.findOne({ time: time })
  if (schedules.repeat === '매일') {
    return console.log('스케줄 매일')
  } else if (schedules.repeat === '한번') {
    if (schedules.date == date) {
      return console.log('스케줄 한번')
    }
  } else if (schedules.repeat === '매주') {
    for (let i = 0; i < schedules.week.length; i++) {
      if (schedules.week[i] == week) {
        console.log('스케줄 매주')
        break
      }
    }
  }

  console.log('schedule', schedules)
}
// function zoneToString(zones) {
//   const rt = []
//   zones.forEach((parent) => {
//     const child = parent.children.map((e) => e.name).join(',')
//     rt.push(`${parent.name}: ${child}`)
//   })
//   return rt
// }
