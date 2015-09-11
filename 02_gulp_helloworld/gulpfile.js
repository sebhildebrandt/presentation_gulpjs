var gulp  = require('gulp')

gulp.task('copyHtml', function() {
  // copy any html files in src/ to dist/
  gulp.src('src/*.html')
    .pipe(gulp.dest('dist'));
});

gulp.watch('src/*.html', ['copyHtml']);

gulp.task('default', ['copyHtml']);