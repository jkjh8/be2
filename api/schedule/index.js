const moment = require('moment')
const Schedules = require('db/models/schedules')

module.exports.get = async () => {
  const time = moment().format('hh:mm')
  const schedules = await Schedules.findOne({ time: time })
  console.log('schedule', schedules)
}
