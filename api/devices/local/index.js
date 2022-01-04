const Devices = require('db/models/devices')

module.exports.check = async (id) => {
  try {
    const r = await Devices.findOne({ _id: id }).populate('parent')
    if (r.parent.status) {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}
