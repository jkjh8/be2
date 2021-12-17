const logger = require('config/logger')
const eventlog = require('api/eventlog')
const Broadcast = require('db/models/broadcast')
const { v4: uuidv4 } = require('uuid')
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
      console.log(args)
      let r
      switch (command) {
        case 'onair':
          r = await onair(args, app)
          const id = uuidv4()
          const broadcastId = new Broadcast({
            id: id,
            zones: r,
            state: true
          })
          await broadcastId.save()
          eventlog.info({
            source: args.user.email,
            zones: args.nodes,
            message: `방송시작 - ${id} - ${args.mode} - ${args.file.name}`
          })
          app.io.emit('pageid', id)
          break
        case 'offair':
          r = await offair(broadcastzones)
          eventlog.info({
            source: args.user.email,
            zones: args.nodes,
            message: '방송종료'
          })
          break
      }
    })
  })
}
