const Devices = require('db/models/devices')
const qsys = require('api/devices/qsys')

const refreshPa = (args) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { ipaddress, channels, children } = args
      const r = await qsys.getPA(ipaddress)
      const { active } = await qsys.updatePA(ipaddress, r)
      const dup = []

      for (let i = 0; i < channels.length; i++) {
        if (active[channels[i] - 1]) {
          dup.push({
            name: children[channels[i] - 1].name,
            channel: channels[i]
          })
        }
      }
      resolve(dup)
    } catch (e) {
      reject(e)
    }
  })
}

exports.check = async (command) => {
  return new Promise(async (resolve, reject) => {
    const { nodes } = command
    const dup = []
    try {
      for (let i = 0; i < nodes.length; i++) {
        const r = await refreshPa(nodes[i])
        if (r && r.length) {
          dup.push({
            name: nodes[i].name,
            dup: r
          })
        }
      }
      resolve(dup)
    } catch (e) {
      reject(e)
    }
  })
}

exports.onair = async (command, app) => {
  return new Promise(async (resolve, reject) => {
    const { name, nodes } = command
    const broadcastzones = []

    try {
      nodes.forEach(async (item) => {
        const r = await qsys.onair({
          ...item,
          name: name
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

        if (nodes.length === broadcastzones.length) {
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
