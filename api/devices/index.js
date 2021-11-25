const Devices = require('db/models/devices')
const logger = require('config/logger')
const Hangul = require('hangul-js')
const eventlog = require('api/eventlog')
const barix = require('./barix')
const qsys = require('./qsys')

module.exports.get = async (req, res) => {
  try {
    const { search } = req.query
    const searchOptions = []

    if (search && search !== 'undefined') {
      searchOptions.push({
        search: new RegExp(Hangul.disassembleToString(search))
      })
    }

    const r = await Devices.find(
      searchOptions.length ? { $and: searchOptions } : {}
    )
    res.status(200).json(r)
  } catch (err) {
    logger.error(`디바이스 - 서버 에러 - ${err}`)
    res.status(500).json({ error: err })
  }
}

module.exports.post = async (req, res) => {
  try {
    const device = new Devices({
      ...req.body
    })
    const r = await device.save()
    logger.info(`디바이스 - 추가 IP: ${device.ipaddress} Name: ${device.name}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 추가 IP: ${device.ipaddress} Name: ${device.name}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 추가 에러 - IP: ${req.body.ipaddress}`)
    res.status(500).json({ message: '디바이스 추가 중 서버 에러', error: e })
  }
}

module.exports.put = async (req, res) => {
  try {
    const device = req.body
    const r = await Devices.updateOne({ _id: device._id }, { $set: device })
    logger.info(`디바이스 - 수정 IP: ${device.ipaddress} Name: ${device.name}`)
    eventlog.info({
      source: req.user.email,
      message: `디바이스 - 수정 IP: ${device.ipaddress} Name: ${device.name}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 - 수정 에러 - IP: ${req.body.ipaddress}`)
    res.status(500).json({ message: '디바이스 수정 중 서버 에러', error: e })
  }
}

module.exports.delete = async (req, res) => {
  try {
    const user = req.user
    const { id } = req.query
    const device = await Devices.findOne({ _id: id })
    const r = await Devices.deleteOne({ _id: id })
    logger.info(`디바이스 삭제 - 완료 - IP: ${device.ipaddress}`)
    eventlog.info({
      source: user.email,
      message: `디바이스 삭제 - IP: ${device.ipaddress}, Name: ${device.name}`
    })
    res.status(200).json(r)
  } catch (e) {
    logger.error(`디바이스 삭제 - 서버에러 - ${id}`)
    res.status(500).json({ message: '디바이스 삭제 중 서버 에러', error: e })
  }
}

module.exports.refresh = async (req, res) => {
  const { devicetype, ipaddress } = req.query
  let r
  try {
    switch (devicetype) {
      case 'Q-Sys':
        r = await qsys.send(ipaddress, {
          id: 'status',
          method: 'StatusGet',
          params: 0
        })
        console.log(r)
        break
      case 'Barix':
        const newData = await barix.get(ipaddress)
        const r = await Devices.updateOne(
          { ipaddress: ipaddress },
          { $set: { detail: newData } }
        )
        break
    }
    res.sendStatus(200)
  } catch (e) {
    res.status(500).json({ error: e })
  }
}
