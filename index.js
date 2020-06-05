const fs = require('fs');
const path = require('path');
const join = require('url-join');
const request = require('request');
const moment = require('moment');
const login = require('./login');

function extracted (fileTarget, validUntil, dateUntil, context, shareUrl, headers2, auth) {
    /**
     * Get share link
     */
    let shareOptions = {
        path: fileTarget,
        shareType: 3,
        permissions: 1,
        expireDate: validUntil
    }
    let additionalInfo = `\n\nValid until: ${dateUntil.format('DD-MM-YYYY')}`

    if (context.config.get('randomPassword') === true) {
        let generator = require('generate-password')

        let password = generator.generate({
            length: 10,
            numbers: true
        })
        shareOptions.password = password
        additionalInfo += `\nPassword: ${password}`
    }

    context.setProgress('Getting link…')
    request({
          method: 'POST',
          uri: shareUrl,
          headers: headers2,
          auth: auth,
          json: shareOptions
      },
      function (error, response, body) {
          try {
              if (response.statusCode === 403) {
                  context.notify('Public upload was disabled by Nextcloud admin, use random password option in config')
              } else {
                  context.copyToClipboard(body.ocs.data.url + additionalInfo)
                  context.notify('Nextcloud uploaded, link copied to Clipboard')
                  context.setProgress('Done', 'completed')
              }
          } catch (e) {
              context.notify('Sorry mate! Could not get share link')
          }
      })
}

const action = async context => {

    if (!context.config.has('username') || !context.config.has('password')) {
        context.setProgress('Authorizing…');
        try {
            await login(context);
        } catch (error) {
            if (error.message === 'canceled') {
                context.cancel();
            } else {
                err(error.message);
            }
            return;
        }
    }

    const url = context.config.get('url');
    const filePath = await context.filePath();
    const filename = path.basename(filePath);
    const fileTarget = join(context.config.get('path') + filename);
    const dateUntil = moment().add(context.config.get('lifeTime'), 'days');
    const validUntil = dateUntil.format('YYYY-MM-DD');
    const uploadUrl = join(url, '/remote.php/webdav/', encodeURI(fileTarget));
    const shareUrl = join(url, '/ocs/v2.php/apps/files_sharing/api/v1/shares');

    /**
     * Create Read Stream of filePath
     */
    const readmeStream = fs.createReadStream(filePath);
    readmeStream.on('error', console.log);
    const {size} = fs.statSync(filePath);
    const headers = {'OCS-APIRequest': 'true', 'Content-Length': size,};
    const headers2 = {'OCS-APIRequest': 'true', 'Accept': 'application/json'};
    const auth = {username: context.config.get('username'), password: context.config.get('password')};

    /**
     *  Upload File to Nextcloud
     */
    context.setProgress('Uploading…');
    request({
            method: 'PUT',
            uri: uploadUrl,
            headers: headers,
            auth: auth,
            body: readmeStream
        },
        function (error, response) {
            if (response.statusCode !== 201) {
                context.config.delete("username");
                context.config.delete("password");
            }

            if (error) {
                return console.error('Nextcloud upload failed:', error);
            }

            extracted(fileTarget, validUntil, dateUntil, context, shareUrl, headers2, auth)
        });
};

const nextcloud = {
    title: 'Share to Nextcloud',
    formats: ['gif', 'mp4', 'webm', 'apng'],
    action,
    config: {
        url: {
            title: 'Nextcloud Url',
            type: 'string',
            required: true
        },
        path: {
            title: 'Nextcloud Path',
            description: 'Path where Files are stored on Nextcloud',
            type: 'string',
            default: '/',
            required: true
        },
        lifeTime: {
            title: 'Share Lifetime in Days',
            type: 'string',
            default: '10'
        },
        randomPassword: {
            title: 'Set random Password for Share',
            description: 'Link and Password will be Copied to Clipboard',
            default: false,
            type: 'boolean'
        }
    }
};

exports.shareServices = [nextcloud];
