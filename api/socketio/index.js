const logger = require('config/logger')
const { onair, offair } = require('./functions')

let broadcastzones = []

exports = module.exports = (app) => {
  app.io.on('connection', (socket) => {
    socket.emit('connection', socket.id)
    logger.info(`Socket io Connected, ${socket.id}`)

    socket.on('disconnect', () => {
      logger.info(`Socket io disconnected, ${socket.id}`)
    })

    socket.on('command', async (command, args) => {
      let r
      switch (command) {
        case 'onair':
          r = await onair(args, app)
          console.log(r)
          broadcastzones = r
          break
        case 'offair':
          r = await offair(broadcastzones)
          console.log(r)
          break
      }
    })
  })
}
