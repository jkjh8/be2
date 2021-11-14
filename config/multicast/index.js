const dgram = require('dgram')
const logger = require('config/logger')

module.exports = (app) => {
  try {
    app.multicast = dgram.createSocket('udp4')
    app.multicast.bind(app.multicastPort, () => {
      app.multicast.setBroadcast(true)
      app.multicast.setMulticastTTL(128)
      app.multicast.addMembership(app.multicastAddress)
    })
  } catch (err) {
    logger.error(`multicast start error, ${err}`)
  }

  app.multicast.on('listening', () => {
    logger.info('Multicast server listening')
  })

  app.multicast.on('message', (msg) => {
    try {
      const message = JSON.parse(msg)
      app.io.emit('multicast', message)
    } catch (err) {
      logger.error(`multicast server receive error, ${err}`)
    }
  })
}
