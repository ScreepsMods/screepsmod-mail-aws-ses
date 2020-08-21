const aws = require('aws-sdk')
const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const path = require('path')
const fs = require('fs')
const os = require('os')

aws.config.update({ region: 'us-east-1' })

module.exports = function (config) {
  const template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/mailer.handlebars'), 'UTF8'))
  const transporter = nodemailer.createTransport({
    SES: new aws.SES({
      apiVersion: '2010-12-01'
    })
  })

  
  config.backend.on('sendUserNotifications', function (user, notifications) {
    if (!user.email) {
      return
    }
    const shard = config.common.storage.env.get('shardName') || os.hostname()
    notifications.forEach(n => {
      n.typeIsError = n.type === 'error'
    })
    const mailOptions = {
      from: 'ScreepsPlus <server@screepspl.us>',
      to: user.email,
      subject: 'ScreepsPlus game notifications',
      html: template({ user, notifications, shard }),
      tags: [
       { name: 'shard', value: shard } 
      ]
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return console.error(error)
      }
    })
  })
}
