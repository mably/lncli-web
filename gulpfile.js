const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const fs = require('fs');
const fse = require('fs-extra');
const gulp = require('gulp');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const livereload = require('gulp-livereload');
const path = require('path');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const sourceMaps = require('gulp-sourcemaps');
const watchify = require('watchify');

gulp.task('eslint', () => gulp.src(['app/**/*.js', 'config/**/*.js', 'lib/**/*.js', 'public/js/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.format()));

gulp.task('js-dist', (done) => {
  fs.readdirSync('config')
    .filter(file => file.substr(-11) === '-example.js')
    .forEach((file) => {
      const filename = file.substr(0, file.length - 11);
      try {
        fs.statSync(`config/${filename}.js`);
      } catch (err) { // file doesn't exist
        gutil.log('Initializing', gutil.colors.cyan(`${filename}.js`), 'file from example...');
        fs.writeFileSync(`config/${filename}.js`,
          fs.readFileSync(`config/${filename}-example.js`));
      }
    });
  done();
});

gulp.task('install', gulp.series('js-dist'));

gulp.task('check', gulp.series('eslint'));

const config = {
  js: {
    srcDir: './public/js/', // Entry points directory
    outputDir: './public/dist/', // Directory to save bundle to
    mapDir: './maps/', // Subdirectory to save maps to
    outputSuffix: '-bundle.js', // Name to use for bundle
    rootDir: 'public', // for browserify-css processRelativeUrl handler
    vendorDir: 'vendor', // for browserify-css processRelativeUrl handler
  },
};

// This method makes it easy to use common bundling options in different tasks
const bundle = (bundler, entryPointName) => {
  const sourcePath = `${config.js.srcDir + entryPointName}.js`;
  const outputFilename = entryPointName + config.js.outputSuffix;
  // Add options to add to "base" bundler passed as parameter
  return bundler
    .bundle() // Start bundle
    .pipe(source(sourcePath)) // Entry point
    .pipe(buffer()) // Convert to gulp pipeline
    .pipe(rename(outputFilename)) // Rename output
    .pipe(sourceMaps.init({ loadMaps: true })) // Strip inline source maps
    .pipe(sourceMaps.write(config.js.mapDir)) // Save source maps to their
  //   own directory
    .pipe(gulp.dest(config.js.outputDir)) // Save 'bundle' to build/
    .pipe(livereload()); // Reload browser if relevant
};

const bundleTask = (entryPointName) => {
  const entryPointPath = `${config.js.srcDir + entryPointName}.js`;
  let bundler = browserify(
    { entries: entryPointPath, debug: true },
  ) // Pass browserify the entry point
    .transform(babelify, { presets: ['es2015'] }) // Then, babelify, with ES2015 preset
    .transform('browserify-css', {
      rootDir: config.js.rootDir,
      global: true,
      processRelativeUrl(relativeUrl) {
        const stripQueryStringAndHashFromPath = (url) => url.split('?')[0].split('#')[0];
        const rootDir = path.resolve(process.cwd(), config.js.rootDir);
        const relativePath = stripQueryStringAndHashFromPath(relativeUrl);
        const queryStringAndHash = relativeUrl.substring(relativePath.length);

        //
        // Copying files from '../node_modules/bootstrap/' to 'dist/vendor/bootstrap/'
        //
        const prefix = '../node_modules/';
        const prefixWin = '..\\node_modules\\';
        if (relativePath.startsWith(prefix) || relativePath.startsWith(prefixWin)) {
          const vendorPath = `${config.js.vendorDir}/${relativePath.substring(prefix.length)}`;
          const sourcePath = path.join(rootDir, relativePath);
          const targetPath = path.join(rootDir, vendorPath);

          fse.copySync(sourcePath, targetPath);

          // Returns a new path string with original query string and hash fragments
          return vendorPath + queryStringAndHash;
        }

        return relativeUrl;
      },
    });

  const updateBundle = function () {
    gutil.log('Updating bundle...');
    bundle(bundler, entryPointName);
    gutil.log('Bundle updated...');
  };

  if (global.isWatching) {
    bundler = watchify(bundler);
    bundler.on('update', updateBundle);
  }

  return bundle(bundler, entryPointName); // Chain other options -- sourcemaps, rename, etc.
};

gulp.task('lndbundler', () => bundleTask('lnd'));

gulp.task('bundlelnd', gulp.series('install', 'check', 'lndbundler'));

gulp.task('bundles', gulp.series('bundlelnd'));

gulp.task('setWatch', (done) => {
  global.isWatching = true;
  done();
});

gulp.task('watchify', gulp.series('setWatch', 'bundles'));

gulp.task('default', gulp.series('bundles'));
