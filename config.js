const electron = require('electron');
const querystring = require('querystring');
const url = require('url');

const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;

const getConfig = context => {

  return new Promise((resolve, reject) => {

    let configWindow = new BrowserWindow({width:400, height:400})
    configWindow.loadURL(`file://${__dirname}/` + `config.html`)

    configWindow.on('closed', () => {
      if (!gotCode) {
        reject(new Error('canceled'));
      }
    });


  });
}

module.exports = getConfig;
