const Eventlog = require('db/models/eventlog')

module.exports.info = async (msg) => {
  const eventMessage = new Eventlog({
    category: 'info',
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
    category: 'warning',
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
    category: 'error',
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
