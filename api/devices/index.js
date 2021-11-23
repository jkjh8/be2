const Devices = require('db/models/devices')
const logger = require('config/logger')
const Hangul = require('hangul-js')
const eventlog = require('api/eventlog')

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
  console.log(req.body)
  const device = new Devices({
    ...req.body
  })
  // device.save()
  res.send('ok')
}
