import {createLogger, LoggerOptions, transports, format} from 'winston';

const options = {
  file: {
    level: 'info',
    filename: 'logs/app.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true
  }
};

const loggerOptions: LoggerOptions = {
  level: 'info',
  format: format.json(),
  transports: [
    new transports.File({filename: 'error.log', level: 'error'}),
    new transports.File({filename: 'combined.log'}),
    new transports.Console(options.console)
  ],
  exitOnError: false
};

const logger = createLogger(loggerOptions);

// logger.stream = {
//   write: (message) => {
//     logger.info(message);
//   },
// };

export default logger;
