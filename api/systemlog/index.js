const Systemlog = require('db/models/serverlog')
const logger = require('config/logger')

module.exports.get = async (req, res) => {
  try {
    const { limit, page, search } = req.query
    const searchOptions = []

    if (search && search !== 'undefined') {
      searchOptions.push({ $text: { $search: search } })
    }

    const paginateOptions = {
      page: page,
      limit: limit,
      sort: { timestamp: -1 }
    }

    const r = await Systemlog.paginate(
      searchOptions.length ? { $and: searchOptions } : {},
      paginateOptions
    )
    res.status(200).json(r)
  } catch (err) {
    logger.error(`시스템 로그 - 서버에러 ${err}`)
    res.status(500).json({ error: err })
  }
}
