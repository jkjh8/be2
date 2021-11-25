const net = require('net')

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
    this._data = ''
    this._noOp = null
    this.client = net.Socket()

    this.noOp = () => {
      if (this._connected) {
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

    this.client.on('data', (data) => {
      if (data[data.length - 1] === 0x00) {
        this._data += data.toString('utf8')
        this._finished = true
      } else {
        this._finished = false
        this._data += data.toString('utf8')
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
        this._finished = false
        const command = JSON.stringify({
          jsonrpc: '2.0',
          id: `${obj.id},${this._ipaddress}`,
          method: obj.method,
          params: obj.params
        })
        this._data = ''
        this.client.write(command + '\0')
        const interval = setInterval(() => {
          if (this._finished) {
            clearInterval(interval)
            this.clearNoOp()
            resolve(this._data)
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
      }
      const r = await clients[ipaddress].send(obj)
      resolve(JSON.parse(r))
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = { qrc, send }
