const gulp = require("gulp");
const jscs = require("gulp-jscs");
var jshint = require("gulp-jshint");

gulp.task("jscs", () => {
	return gulp.src(["app/**/*.js","config/**/*.js","public/js/**/*.js"])
		.pipe(jscs())
		.pipe(jscs.reporter());
});

gulp.task("lint", function() {
	return gulp.src(["app/**/*.js","config/**/*.js","public/js/**/*.js"])
		.pipe(jshint({
			laxbreak: true,
			esversion: 6
		}))
		.pipe(jshint.reporter("default", {
			verbose: true,
		}));
});

gulp.task("default", ["jscs", "lint"]);
