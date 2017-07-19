const electron = require('electron');

const { app, BrowserWindow, Menu, Tray } = electron;

const notify = require('./modules/notify.js');

const http = require('http');
const os = require('os');
const path = require('path');
const url = require('url');
const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const systemSpecs = {
  cpu_speed: os.cpus()[0].speed,
  mem_available: os.freemem(),
  high_spec: false,
};

// 2 684 354 560 == 2.5 GiB
if (systemSpecs.cpu_speed > 2800 && systemSpecs.mem_available > 2684354560) {
  systemSpecs.high_spec = true;
}

exports.systemSpecs = systemSpecs;

const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} = require('electron-devtools-installer');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

console.time('startup'); //eslint-disable-line

function openRantComposer() {
  mainWindow.show();
  mainWindow.webContents.send('compose_rant');
}

function quitApp() {
  mainWindow.webContents.send('quitApp');
}

/** This function will create the tray icon */
function initTray() {
  // No idea why using let or var or const with tray causes the tray not to display anything
  /* eslint-disable */
  tray = new Tray(path.join(__dirname, '/res/images/devrantLogo512.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App', click() { mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Compose A Rant', click() { openRantComposer(); } },
    { type: 'separator' },
    { label: 'Quit', click() { quitApp(); } },
  ]);
  tray.setToolTip('devRantron');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow.show(); });
  /* eslint-enable */
}

/** This function will create the mainWindow */
function createWindow() {
  notify.init();

  // Send usage data to firebase
  if (process.env.NODE_ENV !== 'development') {
    let plat = '';

    if (/^win/.test(process.platform)) { plat = 'windows'; }
    if (/^dar/.test(process.platform)) { plat = 'osx'; }
    if (/^lin/.test(process.platform)) { plat = 'linux'; }

    console.log(`Logging usage. Platform is ${plat}`);

    http.get({
      host: 'https://us-central1-devrantron.cloudfunctions.net',
      path: `/logUser/${plat}`,
    }, (response) => {
      response.on('end', () => {
        console.log('Logged usage.');
      });
    });
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minHeight: 600,
    minWidth: 900,
    show: false,
  });

  if (process.env.NODE_ENV === 'development') {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    /* eslint-disable no-console */
    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => console.log(`Added Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err));

    installExtension(REDUX_DEVTOOLS)
      .then(name => console.log(`Added Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err));
    /* eslint-enable no-console */

    // make sure to load the index from the hot reload server while in development mode
    mainWindow.loadURL('http://localhost:8080');
  } else {
    // we should be in production
    // load the index.html of the app.
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }));
  }

  // just show the window if all content has been loaded
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    // measure startup time
    console.timeEnd('startup'); //eslint-disable-line
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  initTray();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('auto-launch', (event, arg) => {
  if (process.env.NODE_ENV !== 'development') {
    const AutoLaunch = require('auto-launch'); //eslint-disable-line

    const AppAutoLauncher = new AutoLaunch({
      name: 'devRantron',
    });

    if (arg) {
      AppAutoLauncher.enable();
    } else {
      AppAutoLauncher.disable();
    }
  }
});

ipcMain.on('showQRNotif', (sender, n) => {
  console.log('showQR', n);
  notify.show(n);
});

module.exports.sendReply = (i, m) => {
  mainWindow.webContents.send('notifReply', { rantid: i, message: m });
};

ipcMain.on('minimiseApp', () => {
  mainWindow.hide();
});

ipcMain.on('forceQuitApp', () => {
  app.exit(0);
});

ipcMain.on('reLaunch', () => {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit(0);
});

ipcMain.on('updateNow', () => {
  autoUpdater.quitAndInstall();
});


//-------------------------------------------------------------------
// Auto updates
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// autoUpdater.on('checking-for-update', () => {
// });
autoUpdater.on('update-available', () => {
});
autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('upTodate');
});
// autoUpdater.on('error', (err) => {
// });
// autoUpdater.on('download-progress', (progressObj) => {
// });
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('newUpdate');
});

app.on('ready', () => {
  autoUpdater.checkForUpdates();
});
