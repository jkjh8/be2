const { PythonShell } = require('python-shell')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
logger = require('config/logger')

exports.getInfo = async (req, res) => {
  const options = {
    mode: 'json',
    pythonPath: 'python3',
    pythonOptions: ['-u'],
    scriptPath: __dirname,
    args: ['get_info']
  }
  try {
    PythonShell.run('tts.py', options, function (err, result) {
      if (err) {
        logger.error(`TTS 에러 - 정보를 가져올 수 없음 - ${err}`)
        res.status(500).send(err)
      }
      res.status(200).json(result[0])
    })
  } catch (e) {
    logger.error(`TTS 에러 - 정보를 가져올 수 없음 - ${e.message}`)
    res.status(500).send(e.message)
  }
}

exports.preview = async (req, res) => {
  const { name, voice, rate, message } = req.body
  const filename = `${uuidv4()}.mp3`
  const options = {
    mode: 'json',
    pythonPath: '',
    pythonOptions: ['-u'],
    scriptPath: __dirname,
    args: [
      'make_file',
      message,
      path.join(filesPath, 'Temp'),
      filename,
      rate,
      voice.id
    ]
  }
  PythonShell.run('tts.py', options, (err, result) => {
    if (err) {
      logger.error(`TTS에서 - TTS합성에러 -${err}`)
      res.status(500).send(err)
    }
    res.status(200).json({ ...result[0], base: 'Temp' })
  })
}

exports.makeFile = async (req, res) => {
  console.log(req.body)
  const { name, voice, rate, message, folder } = req.body
  let filename
  let filepath
  let base
  if (name && name !== 'undefined') {
    filename = `${name}.mp3`
  } else {
    filename = `${uuidv4()}.mp3`
  }
  if (folder.base && folder.base !== 'undefined') {
    filepath = path.join(filesPath, folder.base, folder.name)
    base = path.join(folder.base, folder.name)
  } else {
    filepath = path.join(filesPath, folder.name)
    base = path.join(folder.name)
  }

  const options = {
    mode: 'json',
    pythonPath: '',
    pythonOptions: ['-u'],
    scriptPath: __dirname,
    args: ['make_file', message, filepath, filename, rate, voice.id]
  }
  PythonShell.run('tts.py', options, (err, result) => {
    if (err) {
      logger.error(`TTS에서 - TTS합성에러 -${err}`)
      res.status(500).send(err)
    }
    res.status(200).json({ ...result[0], base: base })
  })
}
