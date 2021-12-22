const Preset = require('db/models/pagePreset')
const logger = require('config/logger')

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
    logger.error(`새로운 페이지 프로셋 등록 - 에러 ${e.message}`)
    res.sendStatus(500)
  }
}
