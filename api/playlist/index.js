const Playlist = require('db/models/playlist')
const logger = require('config/logger')
const eventlog = require('api/eventlog')

module.exports.get = async (req, res) => {
  try {
    const r = await Playlist.find()
    res.json(r)
  } catch (e) {
    logger.error(`Playlist Error - failed to load ${e}`)
    res.sendStatus(500)
  }
}

module.exports.post = async (req, res) => {
  try {
    const { name, user, list } = req.body
    const playlist = new Playlist({
      name,
      user,
      list
    })
    await playlist.save()
    logger.info(`Playlist Add name: ${name}, user: ${user}, list: ${list}`)
    res.sendStatus(200)
  } catch (e) {
    logger.error(`Playlist Error - failed to add list ${e}`)
    res.sendStatus(500)
  }
}

module.exports.put = async (req, res) => {
  try {
    const { _id, name, user, list } = req.body
    if (!req.user.admin && req.user.email !== user) {
      return res
        .status(403)
        .send('플레이리스트를 수정할 수 있는 권한이 없습니다.')
    }
    await Playlist.updateOne({ _id: _id }, { $set: { name, list } })

    logger.info(
      `Playlist Edit id: ${_id}, name: ${name}, user: ${req.user.email}, list: ${list}`
    )
    res.sendStatus(200)
  } catch (e) {
    logger.error(`Playlist Error - failed to edit list ${e}`)
    res.sendStatus(500)
  }
}

module.exports.remove = async (req, res) => {
  try {
    const { id, name, user } = req.query
    if (!req.user.admin && req.user.email !== user) {
      return res
        .status(403)
        .send('플레이리스트를 삭제할 수 있는 권한이 없습니다.')
    }
    await Playlist.deleteOne({ _id: id })

    logger.info(`Playlist Remove id: ${id}, name: ${name}, user: ${user}`)
    res.sendStatus(200)
  } catch (e) {
    logger.error(`Playlist Error - failed to remove list ${e}`)
    res.sendStatus(500)
  }
}
