const logger = require('config/logger')
const eventlog = require('api/eventlog')
const Broadcast = require('db/models/broadcast')
const Devices = require('db/models/devices')
const { check, onair, offair } = require('./functions')
const fnBroadcast = require('api/broadcast')

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

          if (checked && checked.length) {
            logger.warn(
              `방송구간 중복 - ${checked
                .map(
                  (e) =>
                    e.name + '- 채널 ' + e.dup.map((e) => e.channel).join(',')
                )
                .join(' ')}`
            )
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
          try {
            r = await fnBroadcast.onair(args, app)
            const broadcastId = new Broadcast({
              id: args.id,
              zones: r,
              state: true
            })
            await broadcastId.save()
            logger.info(`방송 - 라이브 시작 ${JSON.stringify(args)}`)
            eventlog.info({
              source: args.user,
              id: args.id,
              zones: args.nodes,
              message: `방송시작 - ${args.mode} - ${args.file.name}`
            })
            app.io.emit('page_start', {
              source: args.user,
              zones: args.nodes
            })

            const deviceState = await Devices.find().populate('children')
            console.log('emit devices')
            app.io.emit('devices', deviceState)

            // player command
            app.multicast.send(
              JSON.stringify({ key: 'onair', ...args }),
              12300,
              app.multicastAddress
            )
          } catch (e) {
            logger.error(`라이브 온에어 - 에러 ${e}`)
          }
          break
        case 'offair':
          try {
            await offair(args)
            await Broadcast.updateOne(
              { id: args.id },
              { $set: { state: false } }
            )
            logger.info(`방송 - 라이브 정지 ${JSON.stringify(args)}`)
            eventlog.info({
              source: args.user,
              id: args.id,
              zones: args.nodes,
              message: '방송 정지'
            })
            app.io.emit('page_end', { source: args.user, zones: args.nodes })

            const deviceState = await Devices.find().populate('children')
            console.log('emit devices')
            app.io.emit('devices', deviceState)

            // player command
            app.multicast.send(
              JSON.stringify({ key: 'offair', ...args }),
              12300,
              app.multicastAddress
            )
          } catch (e) {
            logger.error(`라이브 오프에어 - 에러 ${e}`)
          }
          break
      }
    })
  })
}
