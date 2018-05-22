const electron = require("electron");
const program = require("commander");

// parse command line parameters
program
	.version("1.0.0")
	.option("-s, --serverport [port]", "web server http listening port (defaults to 8280)")
	.option("-x, --httpsport [port]", "web server https listening port (defaults to 8283)")
	.option("-h, --serverhost [host]", "web server listening host (defaults to all ip addresses)")
	.option("-l, --lndhost [host:port]", "RPC lnd host (defaults to localhost:10009)")
	.option("-t, --usetls [path]", "path to a directory containing key.pem and cert.pem files")
	.option("-u, --user [login]", "basic authentication login")
	.option("-p, --pwd [password]", "basic authentication password")
	.option("-r, --limituser [login]", "basic authentication login for readonly account")
	.option("-w, --limitpwd [password]", "basic authentication password for readonly account")
	.option("-m, --macaroon-path [file path]", "path to admin.macaroon file")
	.option("-f, --logfile [file path]", "path to file where to store the application logs")
	.option("-e, --loglevel [level]", "level of logs to display (debug, info, warn, error)")
	.option("-n, --lndlogfile <file path>", "path to lnd log file to send to browser")
	.parse(process.argv);

// First start the back-end server
const server = require("./app/server")(program);

const serverRootPath = server.getURL();

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, "preload.js")
		}
	});

	mainWindow.webContents.setUserAgent(serverRootPath);

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "public/lnd.html"),
		protocol: "file:",
		slashes: true
	}));

	// Open the DevTools.
	//mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on("closed", function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit()
	}
});

app.on("activate", function () {
	// On OS X it"s common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
