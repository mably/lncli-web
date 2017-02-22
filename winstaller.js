var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: './lncliweb-win32-x64',
    outputDirectory: './dist',
    authors: 'Mably',
    exe: 'lncliweb.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
