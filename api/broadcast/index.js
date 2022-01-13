const logger = require('config/logger')
const eventlog = require('api/eventlog')
const Preset = require('db/models/pagePreset')
const Broadcast = require('db/models/broadcast')
const Devices = require('db/models/devices')
const { offair } = require('../socketio/functions')

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
    const args = req.body
    await offair(req.body)
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
    res.sendStatus(200)
  } catch (e) {
    logger.error(`방송 종료 - 에러 ${e}`)
    res.sendStatus(500)
  }
}
