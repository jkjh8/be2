const Eventlog = require('db/models/serverlog')
const logger = require('config/logger')

module.exports.get = async (req, res) => {
  try {
    const { limit, page } = req.query

    const paginateOptions = {
      page: page,
      limit: limit,
      sort: { timestamp: -1 }
    }

    const r = await Eventlog.paginate({}, paginateOptions)
    res.status(200).json(r)
  } catch (err) {
    logger.error(`시스템 로그 - 서버에러 ${err}`)
    res.status(500).json({ error: err })
  }
}
