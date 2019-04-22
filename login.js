const electron = require('electron');
const join = require('url-join');
const {dialog, protocol} = require('electron');

const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;

const login = context => {

    return new Promise((resolve, reject) => {
        let credentials = []

        /**
         * Register nc:// protocol
         */
        protocol.registerStringProtocol('nc', function (request, callback) {
            let url = request.url.substr(5);
            let elements = url.split('&');

            elements.forEach(function(item) {
                let key = item.split(/:(.*)/)[0]
                let value = item.split(/:(.*)/)[1]
                credentials[key] = value
            });

            context.config.set("url", credentials['login/server']);
            context.config.set("username", credentials['user']);
            context.config.set("password", credentials['password']);

            /**
             * Resolve prmise and destroy BrowserWindow
             */
            resolve();
            authWindow.destroy();
        }, function (err) {

        });

        const authWindow = new BrowserWindow({
            'use-content-size': true,
            alwaysOnTop: true,
            autoHideMenuBar: false,
            webPreferences: {
                nodeIntegration: false
            }
        });

        let extraHeaders = { userAgent: 'KapScreenRecorder', extraHeaders: 'OCS-APIREQUEST: true\n ACCEPT_LANGUAGE: "en-US"' }
        authWindow.loadURL(join(context.config.get("url"), '/index.php/login/flow'), extraHeaders);

        /**
         * Reject upload of exported file when authentication was not completed
         */
        authWindow.on('closed', () => {
            if (credentials.length === 0) {
                reject(new Error('canceled'));
            }
        });
    });
}

module.exports = login;
