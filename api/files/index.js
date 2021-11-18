const fs = require('fs')
const path = require('path')
const logger = require('config/logger')

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
    logger.error(`파일 읽기 에러 ${err}`)
    res.status(500).json({ error: err, message: '폴더를 읽을 수 없습니다' })
  }
}

module.exports.createFolder = async (req, res) => {
  try {
    console.log(req.body)
    const currentPath = path.join(filesPath, req.body.folder.join('/'))

    if (fs.existsSync(currentPath)) {
      console.log('폴더 있음')
    }

    logger.info(
      `폴더가 생성되었습니다. user: ${req.user.email}, folder: ${currentPath}`
    )
  } catch (err) {
    logger.error(`폴더 생성 에러 ${err}`)
    res.staus(500).json({ error: err, message: '폴더를 생성할 수 없습니다' })
  }
}
