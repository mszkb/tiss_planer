const bunyan = require('bunyan');
const path = require('path');

const now = new Date();
const filename = `log_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
const logPath = path.join(__dirname, "/../logs/", filename);


const log = bunyan.createLogger({
    name: 'scraper',
    hostname: 'X',
    streams: [
      {
        level: 'info',
        stream: process.stdout            // log INFO and above to stdout
      },
      {
        level: 'error',
        path: logPath  // log ERROR and above to a file
      }
    ]
  });

module.exports = log;