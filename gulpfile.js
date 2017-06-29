var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('app')
      .pipe(webserver({
        directoryListing: {
          enable: true,
          path: 'app'
        }


      }));
});
