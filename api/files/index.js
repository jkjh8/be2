const fs = require('fs')
const path = require('path')
const logger = require('config/logger')
const eventlog = require('api/eventlog')
const dirTree = require('async-directory-tree')

async function getFilesOnDirectory(remotePath, currentPath) {
  const rt = []
  const files = await fs.readdirSync(currentPath, { withFileTypes: true })
  for (let i = 0; i < files.length; i++) {
    if (files[i].isDirectory()) {
      rt.push({
        index: i,
        type: 'directory',
        base: remotePath,
        fullpath: currentPath,
        file: path.join(currentPath, files[i].name),
        stream: path.join(remotePath, files[i].name),
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
          file: path.join(currentPath, files[i].name),
          stream: path.join(remotePath, files[i].name),
          name: files[i].name,
          size: fs.statSync(path.join(currentPath, files[i].name)).size
        })
      } else if (new RegExp(/.mp4|.mkv|.mov/g).test(files[i].name)) {
        rt.push({
          index: i,
          type: 'video',
          base: remotePath,
          fullpath: currentPath,
          file: path.join(currentPath, files[i].name),
          stream: path.join(remotePath, files[i].name),
          name: files[i].name,
          size: fs.statSync(path.join(currentPath, files[i].name)).size
        })
      } else {
        rt.push({
          index: i,
          type: 'etc',
          base: remotePath,
          fullpath: currentPath,
          file: path.join(currentPath, files[i].name),
          stream: path.join(remotePath, files[i].name),
          name: files[i].name,
          size: fs.statSync(path.join(currentPath, files[i].name)).size
        })
      }
    }
  }
  return rt
}

module.exports.get = async (req, res) => {
  try {
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

    const rt = await getFilesOnDirectory(remotePath, currentPath)
    res.status(200).json({ files: rt, path: folder })
  } catch (err) {
    logger.error(`파일 읽기 - 서버 에러 ${err}`)
    res.status(500).json({ error: err, message: '폴더를 읽을 수 없습니다' })
  }
}

module.exports.getSounds = async (req, res) => {
  try {
    const remotePath = 'Sound'
    const currentPath = path.join(filesPath, 'Sound')
    const rt = await getFilesOnDirectory(remotePath, currentPath)
    res.status(200).json(rt)
  } catch (e) {
    logger.error(`Get files error on sound folder ${e}`)
    res.sendStatus(500)
  }
}

module.exports.getFolder = async (req, res) => {
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

  try {
    const rt = []
    const files = await fs.readdirSync(currentPath, { withFileTypes: true })
    for (let i = 0; i < files.length; i++) {
      if (files[i].isDirectory()) {
        rt.push({
          index: i,
          type: 'directory',
          base: remotePath,
          stream: path.join(remotePath, files[i].name),
          fullpath: currentPath,
          name: files[i].name
        })
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
          message: `폴더 생성 - 중복 폴더 Path: ${target}`
        })
        logger.warn(`폴더 생성 - 중복 폴더 - User:${email}  Path: ${target}`)
        res.status(500).json({ error: null, message: '중복 폴더' })
      } else {
        fs.mkdirSync(target)
        logger.info(`폴더 생성 - 완료  - User:${email}  Path: ${target}`)
        res.status(200).json({ message: '생성완료', Path: target })
      }
    } else {
      eventlog.error({
        source: email,
        message: `폴더 생성 - 위치없음 - Path: ${currentPath}}`
      })
      logger.error(
        `폴더 생성 - 위치없음 - User: ${email}  Path: ${currentPath}`
      )
      res.status(500).json({
        error: null,
        message: '생성할 폴더의 위치가 존재 하지 않습니다'
      })
    }

    logger.info(`폴더 생성 - User: ${email}  Path: ${currentPath}`)
  } catch (err) {
    logger.error(`폴더 생성 - 서버 에러 ${err}`)
    res.status(500).json({ error: err, message: '폴더를 생성할 수 없습니다' })
  }
}

const removeFolder = async function (filePath) {
  if (fs.existsSync(filePath)) {
    fs.readdirSync(filePath).forEach((file, index) => {
      const currentPath = `${filePath}/${file}`
      if (fs.lstatSync(currentPath).isDirectory()) {
        removeFolder(currentPath)
      } else {
        fs.unlinkSync(currentPath)
      }
    })
    fs.rmdirSync(filePath)
  }
}

module.exports.deleteTemp = async (req, res) => {
  const folder = path.join(filesPath, 'temp')
  if (fs.existsSync(folder)) {
    fs.readdirSync(folder).forEach((file, index) => {
      const currentPath = `${folder}/${file}`
      if (fs.lstatSync(currentPath).isDirectory()) {
        removeFolder(currentPath)
      } else {
        fs.unlinkSync(currentPath)
      }
    })
  }
}

module.exports.delete = async (req, res) => {
  try {
    const { type, fullpath, name } = req.body
    const target = path.join(fullpath, name)

    if (type === 'directory') {
      removeFolder(target)
      logger.info(`폴더 삭제 - user: ${req.user.email}  path: ${target}`)
    } else {
      if (fs.existsSync(target)) {
        fs.unlinkSync(target)
        logger.info(`파일 삭제 - user: ${req.user.email}  path: ${target}`)
      }
    }
    eventlog.info({
      source: req.user.email,
      message: `파일 (폴더) 삭제 완료 Path: ${target}`
    })
    return res.status(200).json({ target: target, messsage: '삭제완료' })
  } catch (err) {
    eventlog.error({
      source: req.user.email,
      message: `파일 (폴더) 삭제 에러 Path: ${req.body.name}`
    })
    logger.error(
      `파일삭제 - 서버 에러 user: ${req.user.email}  path: ${req.body.name} error: ${err}`
    )
    res.status(500).json({ error: err, message: '파일삭제 서버에러' })
  }
}

module.exports.upload = async (req, res) => {
  try {
    const { folder } = req.body
    const { file } = req.files
    const uploadedfile = path.join(folder, file.name)
    const currentPath = path.join(filesPath, folder, file.name)

    file.mv(currentPath, function (err) {
      if (err) {
        logger.error(
          `파일 업로드 - 에러 - user: ${req.user.email} path: ${uploadedfile} error: ${err}`
        )
        eventlog.error({
          source: req.user.email,
          message: `파일 업로드 - 에러 - path: ${uploadedfile} error: ${err}`
        })
      }
      logger.info(
        `파일 업로드 - 완료 - user: ${req.user.email} path: ${uploadedfile}`
      )
      eventlog.info({
        source: req.user.email,
        message: `파일 업로드 - 완료 - path:${uploadedfile}`
      })
      res.status(200).json({ message: '파일 업로드 완료' })
    })
  } catch (err) {
    const uploadedfile = path.join(folder, file.name)
    logger.error(
      `파일 업로드 - 서버 에러 - user: ${req.user.email} path: ${uploadedfile} error: ${err}`
    )
    eventlog.error({
      source: req.user.email,
      message: `파일 업로드 - 서버 에러 - user: ${req.user.email}path: ${uploadedfile} error: ${err}`
    })
    res.status(500).json({ error: err })
  }
}

module.exports.download = async (req, res) => {
  try {
    const { fullpath, name } = req.body
    logger.info(
      `파일 다운로드 - 완료 - user: ${req.user.email} file:${(fullpath, name)}`
    )
    res.download(path.join(fullpath, name), name)
  } catch (e) {
    logger.error(
      `파일 다운로드 - 서버 에러 - user: ${req.user.email} error: ${e.message}`
    )
    res.status(500).send(e.message)
  }
}

module.exports.getTree = async (req, res) => {
  const tree = await dirTree(filesPath, {})
  console.log(tree)
  res.status(200).json(tree)
}

module.exports.check = async (req, res) => {
  const { folder, name } = req.query
  console.log(folder, name)
  try {
    const currentPath = path.join(filesPath, folder, name)
    console.log(currentPath)

    if (fs.existsSync(currentPath)) {
      logger.warn(
        `파일 업로드 - 파일중복 - user: ${req.user.email} path: ${currentPath}`
      )
      eventlog.warning({
        source: req.user.email,
        message: `파일 업로드 - 파일중복 - path: ${currentPath}`
      })
      res.status(409).send('중복파일')
    } else {
      res.sendStatus(200)
    }
  } catch (e) {
    logger.error(
      `파일 업로드 - 중복확인 서버에러 - user: ${req.user.email} error: ${e.message}`
    )
    eventlog.error({
      source: req.user.email,
      message: `파일 업로드 - 중복확인 서버에러 - user: ${req.user.email} error: ${e.message}`
    })
    res
      .status(500)
      .send('서버 에러가 발생하였습니다. 잠시후에 다시 시도해주세요.')
  }
}
