'use strict';
const fs = require('fs');
const path = require('path');
const urljoin = require('url-join');
const request = require('request');
const moment = require('moment');

const action = async context => {
    const filePath = await context.filePath();
    const filename = path.basename(filePath);
    const fileTarget = urljoin(context.config.get('path') + filename);
    const validUntil = moment().add(7, 'days').format('YYYY-MM-DD');
    const uploadUrl = urljoin(context.config.get('url'), '/remote.php/webdav/', fileTarget);
    const shareUrl = urljoin(context.config.get('url'),'/ocs/v1.php/apps/files_sharing/api/v1/shares');

    /**
     * Create Read Stream of filePath
     */
    const readmeStream = fs.createReadStream(filePath);
    readmeStream.on('error', console.log);
    const {size} = fs.statSync(filePath);

    /**
     *  Upload File to Nextcloud
     */
    context.setProgress('Uploading…');
    await request({
            method: 'PUT',
            uri: uploadUrl,
            headers: {
                'OCS-APIRequest': 'true',
                'Content-Length': size,
            },
            auth: {
                username: context.config.get('username'),
                password: context.config.get('password')
            },
            body: readmeStream
        },
        function (error, response, body) {
            if (error) {
                return console.error('Nextcloud upload failed:', error);
            }
            console.log("Upload done ...");
        });

    /**
     * Get share link
     */
    context.setProgress('Getting link…');
    await request({
            method: 'POST',
            uri: shareUrl,
            headers: {
                'OCS-APIRequest': 'true',
                'Content-Length': size,
            },
            auth: {
                username: context.config.get('username'),
                password: context.config.get('password')
            },
            json: {
                path: fileTarget,
                shareType: 3,
                permissions: 1,
                expireDate: validUntil
            }
        },
        function (error, response, body) {
            context.copyToClipboard(body.ocs.data.url);
            context.notify('Nextcloud uploaded, link copied to Clipboard');
        });
};

const nextcloud = {
    title: 'Share to Nextcloud',
    formats: ['gif', 'mp4', 'webm', 'apng'],
    action,
    config: {
        url: {
            title: 'Url',
            type: 'string',
            default: '',
            required: true
        },
        username: {
            title: 'Username',
            type: 'string',
            default: '',
            required: true
        },
        password: {
            title: 'Password',
            type: 'string',
            default: '',
            required: true
        },
        path: {
            title: 'Nextcloud Path',
            type: 'string',
            default: '/',
            required: true
        }
    }
};

exports.shareServices = [nextcloud];
