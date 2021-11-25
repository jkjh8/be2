const net = require('net')

const clients = {}

const qrc = class {
  constructor(ipaddress) {
    this._ipaddress = ipaddress
    this._connected = false
    this.finished = false
    this.errors = []
    this._data = ''
    this.client = net.connect({ port: 1710, host: this._ipaddress }, () => {
      clients[ipaddress] = this
      this._connected = true
      console.log('qsys connected', this._ipaddress)
    })
    this.client.on('data', (data) => {
      if (data[data.length - 1] === 0x00) {
        data = data.toString('utf8')
        this._data += data
        this.finished = true
      } else {
        this.finished = false
        data = data.toString('utf8')
        this._data += data
      }
    })
    this.client.on('end', () => {
      this._connected = false
      console.log('end')
    })
    this.client.on('error', () => {
      console.log('error')
    })
    this.client.on('close', () => {
      this._connected = false
      console.log('close')
    })
    this.client.on('timeout', () => {
      console.log('timeout')
    })
  }

  send(obj) {
    const command = JSON.stringify({
      jsonrpc: '2.0',
      id: `${obj.id},${this._ipaddress}`,
      method: obj.method,
      params: obj.params
    })
    this.client.write(command + '\0')
  }
}

module.exports.qrc = qrc
module.exports.connect = (ipaddress) => {
  return new Promise((resolve, reject) => {
    if (clients[ipaddress]) {
      if (clients[ipaddress]._connected) {
        resolve(true)
      } else {
        clients[ipaddress].connect()
        while (clients[ipaddress]._connected) {
          resolve(true)
        }
      }
    } else {
      clients[ipaddress] = new qrc(ipaddress)
      const interval = setInterval(() => {
        if (clients[ipaddress]._connected) {
          clearInterval(interval)
          console.log('create')
          resolve(true)
        }
      })
    }
  })
}

module.exports.send = (ipaddress, obj) => {
  return new Promise((resolve, reject) => {
    clients[ipaddress].finished = false
    clients[ipaddress].send(obj)
    const interval = setInterval(() => {
      if (clients[ipaddress].finished) {
        clearInterval(interval)
        console.log(clients[ipaddress]._data)
        resolve(clients[ipaddress]._data)
      }
    })
  })
}
