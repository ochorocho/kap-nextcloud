'use strict';
const fs = require('fs');
const path = require('path');
const urljoin = require('url-join');
const request = require('request');
const moment = require('moment');
const {dialog} = require('electron');
const getConfig = require('./config');

const err = message => dialog.showMessageBox({message, type: "error"});

const action = async context => {
    const filePath = await context.filePath();
    const filename = path.basename(filePath);
    const fileTarget = urljoin(context.config.get('path') + filename);
    const validUntil = moment().add(7, 'days').format('YYYY-MM-DD');
    const uploadUrl = urljoin(context.config.get('url'), '/remote.php/webdav/', fileTarget);
    const shareUrl = urljoin(context.config.get('url'),'/ocs/v1.php/apps/files_sharing/api/v1/shares');


    context.config.set('username', await getConfig(context));
    if (context.config.has('url') == null || context.config.has('username') == null || context.config.has('password') == null || context.config.has('path') == null) {
        context.setProgress('Authorizing…');
        try {
            context.config.set('username', await getConfig(context));
        } catch (error) {
            if (error.message === 'canceled') {
                context.cancel();
            } else {
                err(error.message);
            }
            return;
        }
    }

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
