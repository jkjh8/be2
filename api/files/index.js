const fs = require('fs')
const path = require('path')
const logger = require('config/logger')
const eventlog = require('api/eventlog')

exports.get = async (req, res) => {
  const { folder } = req.body
  let remotePath
  let currentPath
  if (folder && folder.length && folder !== 'undefined') {
    remotePath = folder.join('/')
    currentPath = path.join(filesPath, remotePath)
  } else {
    remotePath = ''
    currentPath = path.join(filesPath)
  }

  console.log(folder, currentPath)

  try {
    const rt = []
    const files = await fs.readdirSync(currentPath, { withFileTypes: true })
    for (let i = 0; i < files.length; i++) {
      if (files[i].isDirectory()) {
        rt.push({
          index: i,
          type: 'directory',
          base: remotePath,
          fullpath: currentPath,
          name: files[i].name
        })
      } else {
        // prettier-ingnore
        if (new RegExp(/.wav|.mp3/g).test(files[i].name)) {
          rt.push({
            index: i,
            type: 'audio',
            base: remotePath,
            fullpath: currentPath,
            name: files[i].name,
            size: fs.statSync(path.join(currentPath, files[i].name)).size
          })
        } else if (new RegExp(/.mp4|.mkv|.mov/g).test(files[i].name)) {
          rt.push({
            index: i,
            type: 'video',
            base: remotePath,
            fullpath: currentPath,
            name: files[i].name,
            size: fs.statSync(path.join(currentPath, files[i].name)).size
          })
        } else {
          rt.push({
            index: i,
            type: 'etc',
            base: remotePath,
            fullpath: currentPath,
            name: files[i].name,
            size: fs.statSync(path.join(currentPath, files[i].name)).size
          })
        }
      }
    }
    res.status(200).json({ files: rt, path: folder })
  } catch (err) {
    logger.error(`파일 읽기 - 서버 에러 ${err}`)
    res.status(500).json({ error: err, message: '폴더를 읽을 수 없습니다' })
  }
}

module.exports.createFolder = async (req, res) => {
  try {
    const { folder, name } = req.body
    const { email } = req.user
    const currentPath = path.join(filesPath, folder.join('/'))
    const target = path.join(filesPath, folder.join('/'), name)

    if (fs.existsSync(currentPath)) {
      if (fs.existsSync(target)) {
        eventlog.warning({
          source: email,
          message: `폴더 생성 - 중복 폴더 Path: ${targert}`
        })
        logger.warning(`폴더 생성 - 중복 폴더, user:${email}, path: ${target}`)
        res.status(500).json({ error: null, message: '중복 폴더' })
      } else {
        fs.mkdirSync(target)
        logger.info(`폴더 생성 - 완료 user:${email}, path: ${target}`)
        res.status(200).json({ message: '생성완료', path: target })
      }
    } else {
      eventlog.error({
        source: email,
        message: `폴더 생성 - 위치없음 Path: ${currentPath}}`
      })
      logger.error(`폴더 생성 - 위치없음. user: ${email}, path: ${currentPath}`)
      res.status(500).json({
        error: null,
        message: '생성할 폴더의 위치가 존재 하지 않습니다'
      })
    }

    logger.info(`폴더가 생성되었습니다. user: ${email}, path: ${currentPath}`)
  } catch (err) {
    logger.error(`폴더 생성 - 서버 에러 ${err}`)
    res.status(500).json({ error: err, message: '폴더를 생성할 수 없습니다' })
  }
}

module.exports.delete = async function (req, res) {
  console.log(req.body)

  res.sendStatus(200)
}
