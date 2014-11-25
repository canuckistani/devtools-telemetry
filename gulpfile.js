var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('test', function() {
  return gulp.src('test/test-devtoolslib.js', {read: false})
    .pip(mocha({reporter: 'nyan'}));
});

gulp.task('watch', ['test'], function() {
  
  gulp.watch(dest + '/**').on('change', function(file) {
    console.log("changed: ", file);
  });
});

gulp.task('default', ['watch']);
