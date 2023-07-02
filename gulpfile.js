const {src, dest, watch, parallel, series} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat')
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const del = require('del')
const webp = require('gulp-webp');
const browserSync = require('browser-sync').create()
const fonter = require('gulp-fonter');
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const fontfacegen = require('gulp-fontfacegen');


let project_folder = "dist"
let source_folder = "app"

// 1. gulp f - запустить один раз перед стартом для конвертации шрифтов
// 2. gulp - запустить для разработки
// 3. gulp build - запустить для подготовки dist-папки

function otf2ttf(){
    return src('app/fonts/*.otf')
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest('app/fonts/'));
}


function fonts() {
  src('app/fonts/*.{ttf, otf}')
  .pipe(ttf2woff())
  .pipe(dest('dist/fonts/'))
  .pipe(dest('app/fonts/'));
 return src('app/fonts/*.ttf')
  .pipe(ttf2woff2())
  .pipe(dest('dist/fonts/'))
  .pipe(dest('app/fonts/'))
}

function fontToCss() {
  return src("./app/fonts/*.{woff,woff2}")
        .pipe(dest("./app/fonts"))
        .pipe(
            fontfacegen({
                filepath: "./app/scss",
                filename: "fonts.scss",
             })
        )
}



function browsersync() {
  browserSync.init({
    server: {
        baseDir: "app/"
    },
    port: 3000,
    notify: false
});
}

function styles() {
  return src(['./app/scss/style.scss'])
  .pipe(sass({outputStyle: 'compressed'})) //expanded -  красивый код
  .pipe(concat('style.min.css'))
  .pipe(autoprefixer({
    overrideBrowserslist: ['last 10 versions'],
    grid: true
  }))
  .pipe(dest('./app/css'))
  .pipe(browserSync.stream());
}

function scripts() {
  return src([
    './node_modules/jquery/dist/jquery.js',
    './app/js/main.js',
  ])
  .pipe(concat('main.min.js'))
  .pipe(uglify())
  .pipe(dest('./app/js'))
  .pipe(browserSync.stream());
}

function images() {
  return src('app/images/**/*.*')
  .pipe(imagemin([
    imagemin.gifsicle({interlaced: true}),
    imagemin.mozjpeg({quality: 75, progressive: true}),
    imagemin.optipng({optimizationLevel: 5}),
    imagemin.svgo({
        plugins: [
            {removeViewBox: true},
            {cleanupIDs: false}
        ]
    })
]))
  .pipe(dest('dist/images'))
}

function webConverter(){
  return src('dist/images/**/*.{png,jpg,jpeg}')
      .pipe(webp())
      .pipe(dest('dist/images/'))
}


//перенос нужных файлов в паку dist (чистовую)
function build(){
  return src([
    'app/**/*.html',
    'app/css/style.min.css',
    'app/js/main.min.js',
  ], {base: 'app'}) //чтобы сохранялись папки файлов, сохраняя путь
  .pipe(dest('dist'))
}

function cleanDist() {
  return del('./dist/')
}

function cleanFonts() {
  return del(['./app/css/style.min.css', './app/css/'])
}

//функция слежения за проектом
function watching() {
  watch(['app/scss/**/*.scss'], styles);
  watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
  watch(['app/**/*.html']).on('change', browserSync.reload);

  watch(['app/images/**/*.{jpeg, jpg, png, svg, gif, ico, webp}'])
}

exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.otf2ttf = otf2ttf
exports.fonts = fonts;
exports.fontToCss = fontToCss;

//команды для работы со шрифтами gulp f
exports.f = series(cleanDist, cleanFonts, otf2ttf, fonts, fontToCss)

//команды, которые будут удаляться по очереди при подготовке чистовика gulp build
exports.build = series(cleanDist, styles, scripts, images, webConverter, build);

//gulp
exports.default = parallel(cleanFonts, styles, scripts, browsersync, watching)

