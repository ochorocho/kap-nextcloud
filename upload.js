const fs = require('fs')
const path = require('path')
const join = require('url-join')
const request = require('request')
const share = require('./share')

const upload = (context, filePath) => {
  const target = join(context.config.get('path') + path.basename(filePath))
  const uploadUrl = join(context.config.get('url'), '/remote.php/webdav/', encodeURI(target))
  const auth = { username: context.config.get('username'), password: context.config.get('password') }
  const { size } = fs.statSync(filePath)
  const headers = { 'OCS-APIRequest': 'true', 'Content-Length': size }
  const readmeStream = fs.createReadStream(filePath)
  readmeStream.on('error', console.log)

  context.setProgress('Uploading…')
  request({
    method: 'PUT',
    uri: uploadUrl,
    headers: headers,
    auth: auth,
    body: readmeStream
  },
  function (error, response) {
    if (response.statusCode !== 201) {
      context.config.delete('username')
      context.config.delete('password')
    } else {
      context.setProgress('Upload finished', 'completed')
      share(context, filePath)
    }

    if (error) {
      return console.error('Nextcloud upload failed:', error)
    }
  })
}

module.exports = upload
