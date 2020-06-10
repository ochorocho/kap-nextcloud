const join = require('url-join')
const request = require('request')
const moment = require('moment')
const path = require('path')

const share = (context, filePath) => {
  const target = join(context.config.get('path') + path.basename(filePath))
  const headers = { 'OCS-APIRequest': 'true', Accept: 'application/json' }
  const validUntil = moment().add(context.config.get('lifeTime'), 'days').format('YYYY-MM-DD')
  const shareUrl = join(context.config.get('url'), '/ocs/v2.php/apps/files_sharing/api/v1/shares')
  const auth = { username: context.config.get('username'), password: context.config.get('password') }

  const shareOptions = {
    path: target,
    shareType: 3,
    permissions: 1,
    expireDate: validUntil
  }
  let additionalInfo = `\n\nValid until: ${validUntil}`

  if (context.config.get('randomPassword') === true) {
    const generator = require('generate-password')

    const password = generator.generate({
      length: context.config.get('pwLength'),
      numbers: true
    })
    shareOptions.password = password
    additionalInfo += `\nPassword: ${password}`
  }

  context.setProgress('Getting link…')
  request({
    method: 'POST',
    uri: shareUrl,
    headers: headers,
    auth: auth,
    json: shareOptions
  },
  function (error, response, body) {
    if (error) {
      console.error(error.message)
    }

    try {
      if (response.statusCode === 403) {
        const regex = /([0-9])\w+/g
        const match = body.ocs.meta.message.match(regex)

        if (match === null) {
          context.notify(body.ocs.meta.message)
        } else {
          const passwordLength = match[match.length - 1]
          context.config.set('pwLength', passwordLength)
          share(context, filePath)
        }
      } else {
        context.copyToClipboard(body.ocs.data.url + additionalInfo)
        context.notify('Nextcloud uploaded, link copied to Clipboard')
        context.setProgress('Done', 'completed')
      }
    } catch (error) {
      context.notify('Could not get share link: ' + error.message)
    }
  })
}

module.exports = share
