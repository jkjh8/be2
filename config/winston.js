import winston from 'winston'
import winstonDaily from 'winston-daily-rotate-file'
require('winston-mongodb')

const logDir = 'logs'
const { combine, timestamp, printf } = winston.format

const logFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss'
    }),
    logFormat
  ),
  transport: [
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 30,
      zippedArchive: true
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true
    }),
    new transports.MongoDB({
      level: 'info',
      db: 'mongodb://localhost:27017/mediaserver',
      options: {
        useUnifiedTopology: true
      },
      collection: 'server_log',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

export { logger }
