'use strict';
const fs = require('fs');
const path = require('path');
const {createClient} = require("webdav");


const action = async context => {
    const filePath = await context.filePath();
    const target = "/screencasts/";
    const filename = path.basename(filePath);

    const client = createClient(
        "https://cloud.example.org/remote.php/webdav/",
        {
            username: "test",
            password: "PADDWORD"
        }
    );
    context.notify("Uploaded to Nextcloud ....");

    // await client.createDirectory(target);
    await fs.createReadStream(filePath).pipe(client.createWriteStream(target + filename));
    context.notify("Uploaded to Nextcloud");
};

const nextcloud = {
    title: 'Share to Nextcloud',
    formats: ['gif', 'mp4', 'webm', 'apng'],
    action,
    config: {
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
            default: '',
            required: true
        }
    }
};

exports.shareServices = [nextcloud];
