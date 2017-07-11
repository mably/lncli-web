const babelify      = require("babelify");
const browserify    = require("browserify");
const browserifycss = require("browserify-css");
const buffer        = require("vinyl-buffer");
const fs            = require("fs");
const fse           = require("fs-extra");
const gulp          = require("gulp");
const gutil         = require("gulp-util");
const jscs          = require("gulp-jscs");
const jshint        = require("gulp-jshint");
const livereload    = require("gulp-livereload");
const merge         = require("merge");
const path          = require("path");
const rename        = require("gulp-rename");
const source        = require("vinyl-source-stream");
const sourceMaps    = require("gulp-sourcemaps");
const watchify      = require("watchify");

gulp.task("jscs", () => {
    return gulp.src(["app/**/*.js","config/**/*.js","lib/**/*.js","public/js/**/*.js"])
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task("jscs-fix", () => {
    return gulp.src(["app/**/*.js","config/**/*.js","lib/**/*.js","public/js/**/*.js"], { base: "." })
        .pipe(jscs({ fix: true }))
        .pipe(jscs.reporter())
        .pipe(gulp.dest("."));
});

gulp.task("lint", function() {
    return gulp.src(["app/**/*.js","config/**/*.js","lib/**/*.js","public/js/**/*.js"])
        .pipe(jshint({
            laxbreak: true,
            esversion: 6
        }))
        .pipe(jshint.reporter("default", {
            verbose: true,
        }));
});

gulp.task("js-dist", function() {
    fs.readdirSync("config")
        .filter(function(file) {
            return file.substr(-11) === "-example.js";
        })
        .forEach(function(file) {
            var filename = file.substr(0, file.length - 11);
            try {
                fs.statSync("config/" + filename + ".js");
            } catch(err) { // file doesn't exist
                gutil.log("Initializing", gutil.colors.cyan(filename + ".js"), "file from example...");
                fs.writeFileSync("config/" + filename + ".js",
                    fs.readFileSync("config/" + filename + "-example.js"));
            }
        });
});

gulp.task("install", ["js-dist"]);

gulp.task("check", ["jscs", "lint"]);

var config = {
    js: {
        srcDir: "./public/js/",      // Entry points directory
        outputDir: "./public/dist/", // Directory to save bundle to
        mapDir: "./maps/",           // Subdirectory to save maps to
        outputSuffix: "-bundle.js",  // Name to use for bundle
        rootDir: "public",           // for browserify-css processRelativeUrl handler
        vendorDir: "vendor"          // for browserify-css processRelativeUrl handler
    },
};

// This method makes it easy to use common bundling options in different tasks
var bundle = function (bundler, entryPointName) {

    var sourcePath = config.js.srcDir + entryPointName + ".js";
    var outputFilename = entryPointName + config.js.outputSuffix;
    // Add options to add to "base" bundler passed as parameter
    bundler
        .bundle()                                    // Start bundle
        .pipe(source(sourcePath))                    // Entry point
        .pipe(buffer())                              // Convert to gulp pipeline
        .pipe(rename(outputFilename))                // Rename output
        .pipe(sourceMaps.init({ loadMaps : true }))  // Strip inline source maps
        .pipe(sourceMaps.write(config.js.mapDir))    // Save source maps to their
                                                     //   own directory
        .pipe(gulp.dest(config.js.outputDir))        // Save 'bundle' to build/
        .pipe(livereload());                         // Reload browser if relevant
};

var bundleTask = function (entryPointName) {

    var entryPointPath = config.js.srcDir + entryPointName + ".js";
    var bundler = browserify({ entries: entryPointPath, debug: true })  // Pass browserify the entry point
                                .transform(babelify, { presets : [ 'es2015' ] })  // Then, babelify, with ES2015 preset
                                .transform("browserify-css", {
        rootDir: config.js.rootDir,
        global: true,
        processRelativeUrl: function(relativeUrl) {
            var stripQueryStringAndHashFromPath = function(url) {
                return url.split('?')[0].split('#')[0];
            };
            var rootDir = path.resolve(process.cwd(), config.js.rootDir);
            var relativePath = stripQueryStringAndHashFromPath(relativeUrl);
            var queryStringAndHash = relativeUrl.substring(relativePath.length);

            //
            // Copying files from '../node_modules/bootstrap/' to 'dist/vendor/bootstrap/'
            //
            var prefix = "../node_modules/";
            var prefixWin = "..\\node_modules\\";
            if (relativePath.startsWith(prefix) || relativePath.startsWith(prefixWin)) {
                var vendorPath = config.js.vendorDir + "/" + relativePath.substring(prefix.length);
                var source = path.join(rootDir, relativePath);
                var target = path.join(rootDir, vendorPath);

                //gutil.log("Copying file from " + JSON.stringify(source) + " to " + JSON.stringify(target));
                fse.copySync(source, target);

                // Returns a new path string with original query string and hash fragments
                return vendorPath + queryStringAndHash;
            }

            return relativeUrl;
        }
    });

    var updateBundle = function() {
        gutil.log("Updating bundle...");
        bundle(bundler, entryPointName)
        gutil.log("Bundle updated...");
    }

    if (global.isWatching) {
        bundler = watchify(bundler);
        bundler.on("update", updateBundle);
    }

    bundle(bundler, entryPointName);  // Chain other options -- sourcemaps, rename, etc.
};

gulp.task("bundlelnd", ["install", "check"], function () {
    bundleTask("lnd");
});

gulp.task("bundle", ["bundlelnd"], function () {
});

gulp.task("setWatch", function() {
    global.isWatching = true;
});

gulp.task("watchify", ["setWatch", "bundle"], function() {
    //your watch functions...
});

gulp.task("default", ["bundle"]);
