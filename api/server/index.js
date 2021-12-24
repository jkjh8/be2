const os = require('os')
const disk = require('diskusage')
const logger = require('config/logger')

module.exports.get = async (req, res) => {
  try {
    let selDisk = os.platform() === 'win32' ? 'c:' : '/'
    const { available, free, total } = await disk.check(selDisk)

    res.status(200).json({
      hostname: os.hostname(),
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      nic: os.networkInterfaces(),
      freedisk: free,
      availabledis: available,
      totaldisk: total
    })
  } catch (e) {
    logger.error(`서버 상태 갱신 - 에러 ${e.message}`)
    res.sendStatus(500)
  }
}
