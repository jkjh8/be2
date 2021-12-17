const logger = require('config/logger')
const eventlog = require('api/eventlog')
const Broadcast = require('db/models/broadcast')
const { check, onair, offair } = require('./functions')

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
        case 'check':
          const checked = await check(args)
          console.log(checked)
          if (checked && checked.length) {
            eventlog.warning({
              source: args.user,
              id: args.id,
              zones: args.nodes,
              message: `방송구간 중복 - ${checked
                .map(
                  (e) =>
                    e.name + '- 채널 ' + e.dup.map((e) => e.channel).join(',')
                )
                .join(' ')}`
            })
          }
          app.io.emit('page_checked', {
            id: args.id,
            dup: checked
          })
          break
        case 'onair':
          r = await onair(args, app)
          const broadcastId = new Broadcast({
            id: args.id,
            zones: r,
            state: true
          })
          await broadcastId.save()
          eventlog.info({
            source: args.user,
            id: args.id,
            zones: args.nodes,
            message: `방송시작 - ${args.mode} - ${args.file.name}`
          })
          break
        case 'offair':
          try {
            const pageId = await Broadcast.findOne({ id: args.id })
            r = await offair(pageId.zones)
            await Broadcast.updateOne(
              { id: args.id },
              { $set: { state: false } }
            )
            eventlog.info({
              source: args.user,
              id: args.id,
              zones: args.nodes,
              message: `방송종료`
            })
          } catch (e) {
            console.error(e)
          }
          break
      }
    })
  })
}
