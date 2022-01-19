const dgram = require('dgram')
const logger = require('config/logger')
const fnBroadcast = require('api/broadcast')

module.exports = (app) => {
  try {
    app.multicast = dgram.createSocket('udp4')
    app.multicast.bind(app.multicastPort, () => {
      app.multicast.setBroadcast(true)
      app.multicast.setMulticastTTL(128)
      app.multicast.addMembership(app.multicastAddress)
      logger.info(`multicast server start at ${app.multiccastAddress}`)
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
      switch (message.key) {
        case 'onEnded':
          fnBroadcast.fnOnEnded(message.value)
          break
      }
      // app.io.emit('multicast', message)
    } catch (err) {
      logger.error(`multicast server receive error, ${err}`)
    }
  })
}
