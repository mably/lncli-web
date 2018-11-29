const electronInstaller = require('electron-winstaller');

const resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: './lncliweb-win32-x64',
  outputDirectory: './dist',
  authors: 'Mably',
  noMsi: true,
  setupIcon: './public/favicon.ico',
  exe: 'lncliweb.exe',
});

resultPromise.then(() => console.log('It worked!'), e => console.log(`No dice: ${e.message}`));
