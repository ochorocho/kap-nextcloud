const electron = require('electron');
const {ipcMain} = require('electron');

const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;

const getConfig = context => {

    return new Promise((resolve) => {

        let configWindow = new BrowserWindow({
            width: 400,
            height: 440,
            alwaysOnTop: true
        });
        configWindow.loadURL(`file://${__dirname}/` + 'config.html');

        let configValues = {
            url: context.config.get("url"),
            username: context.config.get("username"),
            password: context.config.get("password"),
            path: context.config.get("path")
        };
        configWindow.config = configValues;

        ipcMain.on('asynchronous-message', (event, arg) => {
            for (let key in arg) {
                context.config.set(key, arg[key]);
            }
        });

        configWindow.on('closed', () => {
            resolve();
        });
    });
};

module.exports = getConfig;