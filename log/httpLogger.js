const morgan = require('morgan')
const json = require('morgan-json')
const moment = require('moment')
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

            logger.info('', {
                time: moment().format('HH:mm:ss'),
                method,
                url
            })
        }
    }
})

module.exports = httpLogger