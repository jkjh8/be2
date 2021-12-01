const Devices = require('db/models/devices')
const logger = require('config/logger')
const Hangul = require('hangul-js')
const eventlog = require('api/eventlog')
const barix = require('./barix')
const qsys = require('./qsys')

module.exports.get = async (req, res) => {
  try {
    const r = await Devices.find().populate('children').populate('parent')
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 서버 에러 - ${e.message}`)
    res.status(500).json({ error: e.message })
  }
}

module.exports.post = async (req, res) => {
  try {
    const device = await Devices.create({
      ...req.body
    })
    logger.info(`디바이스 - 추가 - ${device.ipaddress}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 추가 - ${device.ipaddress}`
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
    logger.info(`디바이스 - 수정 - ${device.ipaddress}`)
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

module.exports.refresh = async (req, res) => {
  const { devicetype, ipaddress } = req.query
  let r
  try {
    switch (devicetype) {
      case 'Q-Sys':
        r = await qsys.getStatus(ipaddress)
        await Devices.updateOne(
          { ipoaddress: ipaddress },
          { $set: { detail: r, status: true } }
        )
        break
      case 'Barix':
        const newData = await barix.get(ipaddress)
        r = await Devices.updateOne(
          { ipaddress: ipaddress },
          { $set: { detail: newData, status: true } }
        )
        break
    }
    logger.info(
      `디바이스 - 갱신 - ${req.query.ipaddress ?? 'None'}, ${
        req.query.devicetype ?? 'None'
      }`
    )
    res.sendStatus(200)
  } catch (e) {
    await Devices.updateOne(
      { ipaddress: req.query.ipaddress },
      { $set: { status: false } }
    )
    logger.error(
      `디바이스 - 갱신 에러 - ${req.query.ipaddress ?? 'None'}, ${
        req.query.devicetype ?? 'None'
      }`
    )
    res.status(500).json({ error: e })
  }
}
