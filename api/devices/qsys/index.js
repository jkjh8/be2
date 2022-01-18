const net = require('net')
const Devices = require('db/models/devices')

const clients = {}
const noOp = JSON.stringify({
  jsonrpc: '2.0',
  method: 'NoOp',
  params: {}
})

const qrc = class {
  constructor(ipaddress) {
    this._ipaddress = ipaddress
    this._connected = false
    this._finished = false
    this._status = false
    this._data = ''
    this._dataJson = null
    this._noOp = null
    this.client = net.Socket()

    this.noOp = () => {
      if (this._connected) {
        console.log(`noOp ${this._ipaddress}`)
        this.client.write(noOp + '\0')
      } else {
        clearInterval(this._noOp)
      }
    }
    this.clearNoOp = () => {
      return new Promise((resolve, reject) => {
        try {
          clearInterval(this._noOp)
          this._noOp = setInterval(this.noOp, 50000)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }

    this.client.on('data', async (data) => {
      try {
        if (data[data.length - 1] === 0x00) {
          this._data += data.toString('utf8').replace('\0', '')
          this._finished = true
          // console.log(this._data)
        } else {
          if (this._finished) {
            this._data = ''
          }
          this._finished = false
          this._data += data.toString('utf8')
        }
      } catch (e) {
        this._data = ''
        throw e
      }
    })
    this.client.on('end', () => {
      this._connected = false
      this._finished = false
      this._data = ''
      console.log('end')
    })
    this.client.on('error', () => {
      console.log('error')
    })
    this.client.on('close', () => {
      this._connected = false
      this._finished = false
      this._data = ''
      console.log('close')
    })
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => {
          this.client.destroy()
          reject('connection timeout')
        }, 5000)
        this.client.on('connect', () => {
          if (!clients[this._ipaddress]) {
            clients[this._ipaddress] = this.client
          }
          this._connected = true
          this._noOp = setInterval(this.noOp, 50000)
          clearTimeout(timeout)
          resolve(null)
        })
        this.client.on('end', () => {
          clearTimeout(timeout)
          this._connected = false
          reject('socket ended')
        })
        this.client.on('error', () => {
          clearTimeout(timeout)
          reject('socket error')
        })
        this.client.connect({ port: 1710, host: this._ipaddress })
      } catch (e) {
        reject(e)
      }
    })
  }

  send(obj) {
    return new Promise((resolve, reject) => {
      try {
        const command = JSON.stringify({
          jsonrpc: '2.0',
          id: `${obj.id},${this._ipaddress}`,
          method: obj.method,
          params: obj.params
        })
        this._data = ''
        this._finished = false
        this.client.write(command + '\0')
        const interval = setInterval(() => {
          if (this._finished) {
            clearInterval(interval)
            this.clearNoOp()
            if (this._data) {
              resolve(this._data)
            } else {
              reject()
            }
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

const send = async (ipaddress, obj) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!clients[ipaddress] || !clients[ipaddress]._connected) {
        clients[ipaddress] = new qrc(ipaddress)
        await clients[ipaddress].connect()
        setTimeout(async () => {
          const r = await clients[ipaddress].send(obj)
          resolve(JSON.parse(r))
        }, 500)
      } else {
        const r = await clients[ipaddress].send(obj)
        const result = JSON.parse(r)
        if (result) {
          resolve(result)
        } else {
          reject()
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}

const getStatus = async (ipaddress) => {
  try {
    const command = {
      id: `status,${ipaddress}`,
      method: 'StatusGet',
      params: 0
    }
    const r = await send(ipaddress, command)
    if (Object.keys(r).includes('result')) {
      return r.result
    } else {
      return null
    }
  } catch (e) {
    throw e
  }
}

const getPA = async (ipaddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const command = {
        id: `pa,${ipaddress}`,
        method: 'Component.GetControls',
        params: { Name: 'PA' }
      }
      const r = await send(ipaddress, command)
      if (Object.keys(r).includes('result')) {
        resolve(r.result.Controls)
      } else {
        resolve(null)
      }
    } catch (e) {
      reject(e)
    }
  })
}

async function updatePA(ipaddress, arr) {
  return new Promise(async (resolve, reject) => {
    const gain = []
    const mute = []
    const active = []
    try {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].Name.match(/zone.\d+.gain/)) {
          const channel = arr[i].Name.replace(/[^0-9]/g, '')
          gain[channel - 1] = arr[i].Value
        } else if (arr[i].Name.match(/zone.\d+.mute/)) {
          const channel = arr[i].Name.replace(/[^0-9]/g, '')
          mute[channel - 1] = arr[i].Value
        } else if (arr[i].Name.match(/zone.\d+.active/)) {
          const channel = arr[i].Name.replace(/[^0-9]/g, '')
          active[channel - 1] = arr[i].Value
        }
      }
      await Devices.updateOne(
        { ipaddress: ipaddress },
        { $set: { gain, mute, active, status: true } }
      )
      resolve({ gain, mute, active })
    } catch (e) {
      reject(e)
    }
  })
}

const setVolume = async (value) => {
  try {
    const { volume, mute, channel, device } = value

    if (device.devicetype === 'Q-Sys') {
      const command = {
        id: `vol,${device.ipaddress}`,
        method: 'Component.Set',
        params: {
          Name: 'PA',
          Controls: []
        }
      }
      if (volume !== null && volume !== 'undefined') {
        command.params.Controls.push({
          Name: `zone.${channel}.gain`,
          Value: volume
        })
      }
      if (mute !== null && mute !== 'undefined') {
        command.params.Controls.push({
          Name: `zone.${channel}.mute`,
          Value: mute
        })
      }
      console.log('command', command)
      const r = await send(device.ipaddress, command)
      console.log('qsys rt', r)
      return r
    }
  } catch (e) {
    console.error(e)
  }
}

const setChannel = async (parent, child, port, channel) => {
  try {
    const command = {
      jsonrpc: '2.0',
      id: 'setChannel',
      method: 'Component.Set',
      params: {
        Name: `TX${channel}`,
        Controls: [
          { Name: 'host', Value: child },
          { Name: 'port', Value: port }
        ]
      }
    }
    return await send(parent, command)
  } catch (e) {
    console.error(e)
  }
}

const clearChannel = async (parent, child, channel) => {
  try {
    const command = {
      jsonrpc: '2.0',
      id: 'setChannel',
      method: 'Component.Set',
      params: {
        Name: `TX${channel}`,
        Controls: [{ Name: 'host', Value: '' }]
      }
    }
    return await send(parent, command)
  } catch (e) {
    console.error(e)
  }
}

const onair = async (args) => {
  try {
    const { name, ipaddress, channels, priority, maxtime } = args
    const command = {
      jsonrpc: '2.0',
      id: `onair`,
      method: 'PA.PageSubmit',
      params: {
        Zones: channels,
        Description: name,
        Mode: 'live',
        Station: 1,
        Priority: priority,
        Start: true,
        MaxPageTime: maxtime
      }
    }
    return await send(ipaddress, command)
  } catch (e) {
    throw e
  }
}

const offair = async (args) => {
  try {
    const { ipaddress, pageid } = args
    const command = {
      jsonrpc: '2.0',
      id: `offair`,
      method: 'PA.PageStop',
      params: {
        PageID: pageid
      }
    }
    const r = await send(ipaddress, command)
    return r
  } catch (e) {
    throw e
  }
}

const cancelAll = async (ipaddress) => {
  try {
    const command = {
      jsonrpc: '2.0',
      id: 'cancelall',
      method: 'Component.Set',
      params: {
        Name: 'PA',
        Controls: [
          {
            Name: 'cancel.all.commands',
            Value: 1
          }
        ]
      }
    }
    const r = await send(ipaddress, command)
    return r
  } catch (e) {
    throw e
  }
}

module.exports = {
  qrc,
  send,
  getStatus,
  getPA,
  setVolume,
  setChannel,
  clearChannel,
  onair,
  offair,
  updatePA,
  cancelAll
}
