const morgan = require('morgan')
const json = require('morgan-json')
const format = json({
    method: ':method',
    url: ':url'
})

const logger = require('./logger')
const httpLogger = morgan(format, {
    stream: {
        write: (message) => {
            const {
                method,
                url
            } = JSON.parse(message)

            logger.info('HTTP Access Log', {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                method,
                url
            })
        }
    }
})

module.exports = httpLogger