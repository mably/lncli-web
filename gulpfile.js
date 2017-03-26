const gulp = require("gulp");
const jscs = require("gulp-jscs");
const jshint = require("gulp-jshint");
const fs = require("fs");
const gutil = require("gulp-util");

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

gulp.task('js-dist', function() {
	fs.readdirSync('config')
		.filter(function(file) {
			return file.substr(-11) === '-example.js';
		})
		.forEach(function(file) {
			var filename = file.substr(0, file.length - 11);
			try {
				fs.statSync('config/' + filename + '.js');
			} catch(err) { // file doesn't exist
				gutil.log('Initializing', gutil.colors.cyan(filename + '.js'), 'file from example...');
				fs.writeFileSync('config/' + filename + '.js',
					fs.readFileSync('config/' + filename + '-example.js'));
			}
		});
});

gulp.task("install", ["js-dist"]);

gulp.task("check", ["jscs", "lint"]);

gulp.task("default", ["install", "check"]);
