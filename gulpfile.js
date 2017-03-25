const gulp = require("gulp");
const jscs = require("gulp-jscs");
const jshint = require("gulp-jshint");

gulp.task("jscs", () => {
	return gulp.src(["app/**/*.js","config/**/*.js","public/js/**/*.js"], { base: "." })
		.pipe(jscs())
		.pipe(jscs.reporter());
});

gulp.task("jscs-fix", () => {
	return gulp.src(["app/**/*.js","config/**/*.js","public/js/**/*.js"], { base: "." })
		.pipe(jscs({ fix: true }))
		.pipe(jscs.reporter())
		.pipe(gulp.dest("."));
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
