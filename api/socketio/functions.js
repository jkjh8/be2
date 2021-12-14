const Devices = require('db/models/devices')
const qsys = require('api/devices/qsys')

exports.onair = async (command, app) => {
  return new Promise((resolve, reject) => {
    const broadcastzones = []

    try {
      command.nodes.forEach(async (item) => {
        const r = await qsys.onair({
          ...item,
          name: command.name
        })
        const device = await Devices.findOneAndUpdate(
          { ipaddress: item.ipaddress },
          { $set: { pageid: r.result.PageID } }
        )

        broadcastzones.push({
          name: device.name,
          ipaddress: device.ipaddress,
          pageid: r.result.PageID
        })

        app.io.emit('page_message', `${device.name} 방송 기동 완료`)

        if (command.nodes.length === broadcastzones.length) {
          resolve(broadcastzones)
        }
      })
    } catch (e) {
      console.error(e.message)
      reject(e.message)
    }
  })
}

exports.offair = async (command) => {
  return new Promise((resolve, reject) => {
    const broadcastzones = []
    try {
      command.forEach(async (item) => {
        const r = await qsys.offair(item)
        if (r.result) {
          broadcastzones.push({
            name: item.name,
            ipaddress: item.ipaddress
          })
        }
        if (broadcastzones.length === command.length) {
          resolve(broadcastzones)
        }
      })
    } catch (e) {
      console.error(e.message)
      reject(e.message)
    }
  })
}
