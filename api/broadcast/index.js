const logger = require('config/logger')
const eventlog = require('api/eventlog')
const Preset = require('db/models/pagePreset')
const Broadcast = require('db/models/broadcast')
const Devices = require('db/models/devices')
// const { offair } = require('../socketio/functions')
const qsys = require('api/devices/qsys')
const { fnRefreshPa } = require('api/devices')

module.exports.getPreset = async (req, res) => {
  try {
    const { user } = req.query
    const r = await Preset.find({ user: user })
    res.status(200).json(r)
  } catch (e) {
    res.sendStatus(500)
  }
}

module.exports.savePreset = async (req, res) => {
  try {
    const preset = new Preset({
      ...req.body
    })
    const r = await preset.save()
    logger.info(`새로운 페이지 프로셋 등록 - ${JSON.stringify(req.body)}`)
    res.status(200).json(r)
  } catch (e) {
    logger.error(`새로운 페이지 프로셋 등록 - 에러 ${e}`)
    res.sendStatus(500)
  }
}

module.exports.onEnded = async (req, res) => {
  try {
    await fnOnEnded(req.body)
  } catch (e) {
    logger.error(`방송 종료 - 에러 ${e}`)
    res.sendStatus(500)
  }
}

const fnOnEnded = async (args) => {
  await offair(args)
  await Broadcast.updateOne({ id: args.id }, { $set: { state: false } })
  logger.info(`방송 - 라이브 종료 ${JSON.stringify(args)}`)
  eventlog.info({
    source: args.user,
    id: args.id,
    zones: args.nodes,
    message: `방송종료`
  })
  app.io.emit('page_end', { source: args.user, zones: args.nodes })
  const deviceState = await Devices.find().populate('children')
  app.io.emit('devices', deviceState)
}

module.exports.fnOnEnded = fnOnEnded

module.exports.cancelAll = async (req, res) => {
  try {
    const user = req.user.email
    let devices = await Devices.find({ devicetype: 'Q-Sys', mode: 'Master' })
    for (let i = 0; i < devices.length; i++) {
      console.log(devices[i].ipaddress)
      await qsys.cancelAll(devices[i].ipaddress, user)
      await fnRefreshPa(devices[i].ipaddress)
    }
    logger.warn(`전체 방송 강제 취소 - user: ${user}`)
    eventlog.warning({
      source: user,
      message: '전체 방송 강제 취소'
    })
    devices = await Devices.find().populate('children')
    res.status(200).json(devices)
  } catch (e) {
    logger.error(`전체 방송 강제 취소 - 에러 ${e}`)
    res.status(500).send(e)
  }
}

const onair = async (command) => {
  return new Promise(async (resolve, reject) => {
    try {
      // set timeout
      const timeout = setTimeout(() => {
        reject('onair time out')
      }, 60000)

      // start command
      const { name, nodes, priority, maxtime } = command
      const broadcastzones = []

      nodes.forEach(async (item) => {
        const rt = await qsys.onair({
          ...item,
          name,
          priority,
          maxtime
        })

        // device onair update
        const device = await Devices.findOne({ ipaddress: item.ipaddress })
        for (let i = 0; i < item.channels.length; i++) {
          device.active[item.channels[i] - 1] = true
        }
        // update PageID
        device.pageid = rt.result.PageID
        // db update
        await device.save()

        broadcastzones.push({
          broadcastname: name,
          name: device.name,
          ipaddress: device.ipaddress,
          pageid: device.pageid
        })

        // send socket message
        app.io.emit('page_message', `${device.name} 방송 기동 완료`)

        // resolve condition
        if (nodes.length === broadcastzones.length) {
          clearTimeout(timeout)
          resolve(broadcastzones)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

const offair = async (command) => {
  return new Promise((resolve, reject) => {
    try {
      // set timeout
      const timeout = setTimeout(() => {
        reject('offair timeout')
      }, 60000)

      // start command
      const { name, nodes } = command
      const broadcastzones = []

      nodes.forEach(async (item) => {
        const device = await Devices.findOne({ ipaddress: item.ipaddress })
        // command offair
        const rt = await qsys.offair(device)
        for (let i = 0; i < item.channels.length; i++) {
          device.active[item.channels[i] - 1] = false
        }

        // update db
        await device.save()

        // upadte broadcast zones
        if (rt.result) {
          broadcastzones.push({
            broadcastname: name,
            name: device.name,
            ipaddress: device.ipaddress,
            pageid: device.pageid
          })
        }

        //resolve condition
        if (broadcastzones.length === nodes.length) {
          resolve(broadcastzones)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports.onair = onair
module.exports.offair = offair
