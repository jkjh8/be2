const { PythonShell } = require('python-shell')
const { v4: uuidv4 } = require('uuid')
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
