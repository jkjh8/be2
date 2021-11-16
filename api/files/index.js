const fs = require('fs')
const path = require('path')
const logger = require('config/logger')

exports.get = async (req, res) => {
  const { folder } = req.body
  let remotePath
  let currentPath
  if (folder && folder !== 'undefined') {
    remotePath = folder.join('/')
    currentPath = path.join(filesPath, remotePath)
  } else {
    remotePath = ''
    currentPath = path.join(filesPath)
  }

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
  }
}
