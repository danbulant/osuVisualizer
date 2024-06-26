const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const RPC = require("discord-rpc");
const rpc = new RPC.Client({ transport: "ipc" });
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

if (!isDev) require('update-electron-app')()

console.log("isDev?", isDev);

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

var mainWindow;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        autoHideMenuBar: true
    });
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

    // Open the DevTools.
    if(isDev) mainWindow.webContents.openDevTools({
        activate: true,
        mode: 'detach'
    });
};

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
    awaitWriteFinish: true,
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

async function setActivity() {
    if (!rpc || !mainWindow) {
        return;
    }

    const activity = await mainWindow.webContents.executeJavaScript('window.songActivity');

    rpc.setActivity(activity).catch((e) => { console.error(e); });
}

rpc.on('ready', () => {
    setActivity();

    // activity can only be set every 15 seconds
    setInterval(() => {
        setActivity();
    }, 15e3);
});

rpc.login({ clientId: "756806736106618951" });