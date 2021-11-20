const Eventlog = require('db/models/eventlog')
const logger = require('config/logger')

module.exports.info = async (msg) => {
  const eventMessage = new Eventlog({
    priority: 'info',
    message: msg.message
  })
  if (msg.source) {
    eventMessage.source = msg.source
  }
  if (msg.zones && msg.zones.length) {
    eventMessage.zones = msg.zones
  }
  return await eventMessage.save()
}

module.exports.warning = async (msg) => {
  const eventMessage = new Eventlog({
    priority: 'warning',
    message: msg.message
  })
  if (msg.source) {
    eventMessage.source = msg.source
  }
  if (msg.zones && msg.zones.length) {
    eventMessage.zones = msg.zones
  }
  return await eventMessage.save()
}

module.exports.error = async (msg) => {
  const eventMessage = new Eventlog({
    priority: 'error',
    message: msg.message
  })
  if (msg.source) {
    eventMessage.source = msg.source
  }
  if (msg.zones && msg.zones.length) {
    eventMessage.zones = msg.zones
  }
  return await eventMessage.save()
}

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
      sort: { createdAt: -1 }
    }

    const r = await Eventlog.paginate(
      searchOptions.length ? { $and: searchOptions } : {},
      paginateOptions
    )
    res.status(200).json(r)
  } catch (err) {
    logger.error(`이벤트로그 - 서버에러 - ${err}`)
    res.status(500).json({ error: err })
  }
}
