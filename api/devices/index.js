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
    logger.info(`디바이스 - 수정 - ${device.ipaddress}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 수정 - ${device.ipaddress}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 수정 에러 - ${req.body.ipaddress} ${e.message}`)
    res
      .status(500)
      .json({ message: '디바이스 수정 중 서버 에러', error: e.message })
  }
}

module.exports.checkChannel = async (req, res) => {
  try {
    const { parent, channel } = req.query
    const r = await Devices.find({ parent: parent, channel: channel })
    logger.info(`디바이스 채널 확인 - ${parent} ${channel}`)
    res.status(200).send(r.length > 0)
  } catch (e) {
    logger.error(`디바이스 채널 확인 - 에러 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

module.exports.addChild = async (req, res) => {
  try {
    const { parent, child } = req.query
    const device = await Devices.findById(parent)
    device.children.push(child)
    const r = await device.save()
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
          { $set: { detail: r } }
        )
        break
      case 'Barix':
        const newData = await barix.get(ipaddress)
        r = await Devices.updateOne(
          { ipaddress: ipaddress },
          { $set: { detail: newData } }
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
    logger.error(
      `디바이스 - 갱신 에러 - ${req.query.ipaddress ?? 'None'}, ${
        req.query.devicetype ?? 'None'
      }`
    )
    res.status(500).json({ error: e })
  }
}
