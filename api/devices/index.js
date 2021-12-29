const Devices = require('db/models/devices')
const logger = require('config/logger')
const eventlog = require('api/eventlog')
const barix = require('./barix')
const qsys = require('./qsys')

module.exports.get = async (req, res) => {
  try {
    const r = await Devices.find().populate('children').populate('parent')
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 서버 에러 - ${e}`)
    res.status(500).json({ error: e })
  }
}

module.exports.getParent = async (req, res) => {
  try {
    const r = await Devices.find({ mode: 'Master' }).populate('children')
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 서버 에러 ${e}`)
  }
}

module.exports.post = async (req, res) => {
  try {
    const device = await Devices.create({
      ...req.body
    })
    logger.info(`디바이스 - 추가 - ${JSON.stringify(device)}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 추가 - ${JSON.stringify(device)}`
    })
    res.status(200).json(device)
  } catch (e) {
    logger.error(`디바이스 - 추가 에러 - ${e.message} ${req.body}`)
    res.status(500).json({ message: e.message })
  }
}

module.exports.put = async (req, res) => {
  try {
    const device = req.body
    const r = await Devices.updateOne({ _id: device._id }, { $set: device })
    const rtDevice = await Devices.findOne({ _id: device._id })
    logger.info(`디바이스 - 수정 - ${JSON.stringify(device)}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 수정 - ${device.ipaddress}`
    })
    res.status(200).json(rtDevice)
  } catch (e) {
    logger.error(`디바이스 - 수정 에러 - ${req.body.ipaddress} ${e.message}`)
    res
      .status(500)
      .json({ message: '디바이스 수정 중 서버 에러', error: e.message })
  }
}

module.exports.checkChannel = async (req, res) => {
  try {
    const { parent, child, channel } = req.query
    console.log(parent, child, channel)
    const r = await Devices.findOne({ _id: parent }).populate('children')
    for (let i = 0; i < r.children.length; i++) {
      if (r.children[i].channel == channel) {
        if (String(r.children[i]._id) !== child) {
          logger.info(`디바이스 채널 확인 - 중복 - ${parent} ${channel}`)
          return res.status(200).send(true)
        }
      }
    }
    logger.info(`디바이스 채널 확인 - 확인 - ${parent} ${channel}`)
    res.status(200).send(null)
  } catch (e) {
    logger.error(`디바이스 채널 확인 - 에러 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

module.exports.updateMasterChannel = async (req, res) => {
  try {
    const { id, channels } = req.body
    const r = await Devices.updateOne(
      { _id: id },
      { $set: { children: channels } }
    )
    logger.info(`마스터 채널 업데이트 - ID: ${id}, Channles: ${channels}`)
    // qsys 채널 갱신 추가
    res.status(200).json(r)
  } catch (e) {
    logger.error(`마스터 채널 업데이트- 에러 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

module.exports.updateChildChannel = async (req, res) => {
  try {
    const { id, channel, parent } = req.body
    const r = await Devices.updateOne(
      { _id: id },
      { $set: { channel: channel, parent: parent } }
    )
    res.status(200).json(r)
  } catch (e) {
    logger.error(`슬레이브 채널 업데이트 - 에러 - ${e.message}`)
  }
}

module.exports.checkChild = async (req, res) => {
  try {
    const { parent, channels } = req.body
    console.log(parent, channels)
    const r = await Devices.find({
      $and: [{ _id: { $ne: parent } }, { children: { $all: channels } }]
    })
    if (r && r.length) {
      logger.warn(`지역 중복체크 - 중복 - ${r.map((e) => e.name)}`)
    }
    res.status(200).send(null)
  } catch (e) {
    logger.error(`지역 중복 체크 에러 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

module.exports.addChild = async (req, res) => {
  try {
    const { parent, child } = req.query
    // 중복삭제
    const dup = await Devices.find({ children: { $all: [child] } })
    dup.forEach(async (item) => {
      const children = item.children.filter((e) => String(e) !== child)
      item.children = children
      await item.save()
    })
    // 방송구간추가
    const device = await Devices.findById(parent)
    device.children.push(child)
    const r = await device.save()

    // qsys 채널 갱신 추가
    logger.info(`디바이스 Child 추가 - ${child}`)
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 child 추가 에러 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

module.exports.delete = async (req, res) => {
  try {
    const user = req.user
    const { id } = req.query
    const device = await Devices.findOne({ _id: id })
    const r = await Devices.deleteOne({ _id: id })
    logger.info(`디바이스 삭제 - 완료 - ${device.ipaddress}`)
    eventlog.info({
      source: user.email,
      message: `디바이스 삭제 - ${device.ipaddress},`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 삭제 - 서버에러 - ${e.message}}`)
    res.status(500).json({ message: e.message })
  }
}

// 상태 갱신
const fnRefresh = async (device) => {
  try {
    const { devicetype, ipaddress } = device
    let r
    switch (devicetype) {
      case 'Q-Sys':
        r = await qsys.getStatus(ipaddress)
        break
      case 'Barix':
        r = await barix.get(ipaddress)
        break
    }
    return await Devices.updateOne(
      { ipaddress },
      { $set: { detail: r, status: true } }
    )
  } catch (e) {
    logger.error(`디바이스 - 갱신 에러 ${e.message}`)
    await Devices.updateOne({ ipaddress }, { $set: { status: false } })
    throw e
  }
}

module.exports.getStatusDevice = async () => {
  try {
    const devices = await Devices.find()
    devices.forEach(async (device) => {
      await fnRefresh(device)
    })
  } catch (e) {
    logger.error(`디바이스 갱신 - 에러 ${e.message}`)
  }
}

module.exports.refresh = async (req, res) => {
  try {
    await fnRefresh(req.query)
    logger.info(
      `디바이스 - 갱신 - ${req.query.ipaddress ?? 'None'}, ${
        req.query.devicetype ?? 'None'
      }`
    )
    res.sendStatus(200)
  } catch (e) {
    logger.error(`디바이스 - 수동 갱신 에러 ${e.message}`)
    res.status(500).json({ error: e })
  }
}

module.exports.getStatusPA = async () => {
  try {
    const devices = await Devices.find({ devicetype: 'Q-Sys' })
    for (let i = 0; i < devices.length; i++) {
      const r = await qsys.getPA(devices[i].ipaddress)
      await qsys.updatePA(devices[i].ipaddress, r)
    }
    return
  } catch (e) {
    logger.error(`PA 상태 갱신 - 에러 ${e.message}`)
  }
}

module.exports.refreshPa = async (req, res) => {
  try {
    await refreshPa(req.query.ipaddress)
    res.sendStatus(200)
  } catch (e) {
    logger.error(`디바이스 PA - 에러 - ${e}`)
    res.status(500).send(e)
  }
}

const refreshPa = async (ipaddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const r = await qsys.getPA(ipaddress)
      if (r) {
        await qsys.updatePA(ipaddress, r)
      }
      resolve()
    } catch {
      reject()
    }
  })
}

module.exports.volume = async (req, res) => {
  try {
    const { device, volume, mute, channel } = req.body
    const target = await Devices.findOne({ ipaddress: device.ipaddress })
    target.mute[channel - 1] = mute
    if (volume || volume === 0) {
      target.gain[channel - 1] = volume
    }

    await target.save()
    const r = await qsys.setVolume(req.body)
    if (r && r.result) {
      logger.info(
        `디바이스 - 볼륨 변경 - ${device.ipaddress} channel: ${channel} vol: ${volume} mute: ${mute}`
      )
      const devices = await Devices.find().populate('children')
      res.status(200).json(devices)
    } else {
      logger.error(`디바이스 -볼륨 에러 - ${r}`)
      res.sendStatus(500)
    }
  } catch (e) {
    logger.error(`디바이스 - 볼륨 에러 - ${e.message}`)
    res.sendStatus(500)
  }
}

module.exports.cancelAll = async (req, res) => {
  try {
    const { ipaddress, user } = req.query
    await qsys.cancelAll(ipaddress, user)
    await refreshPa(ipaddress)
    logger.warn(`방송강제취소 - user: ${user}, IP: ${ipaddress}`)
    eventlog.warning({
      source: req.user.email,
      message: `방송강제취소 - ${ipaddress}`
    })
    const devices = await Devices.find().populate('children')
    res.status(200).json(devices)
  } catch (e) {
    logger.error(`방송강제취소 - 에러 ${req.query}`)
    res.sendStatus(500)
  }
}
