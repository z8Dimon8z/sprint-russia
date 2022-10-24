const { src, dest, watch, parallel, series }  = require('gulp');

const scss = require('gulp-sass')(require('sass')); // работа c sass
const concat        = require('gulp-concat'); // Обяденение файлов
const browserSync   = require('browser-sync').create(); // сервер
const uglify        = require('gulp-uglify-es').default; // сжатие js
const autoprefixer  = require('gulp-autoprefixer'); // префиксы в css
const imagemin      = require('gulp-imagemin'); // сжатие картинок
const del           = require('del'); // удаление из файлов из папки dist перед билдом (финалом)
const svgSprite = require('gulp-svg-sprite'); // сщздание svg спрайта
const cheerio = require('gulp-cheerio'); // обработка svg спрайта
const replace = require('gulp-replace'); // работа с ошибками svg спрайта

function svgSprites() {
  return src('app/images/icons/*.svg') // выбираем в папке с иконками все файлы с расширением svg
  .pipe(cheerio({
        run: ($) => {
            $("[fill]").removeAttr("fill"); // очищаем цвет у иконок по умолчанию, чтобы можно было задать свой
            $("[stroke]").removeAttr("stroke");  // очищаем, если есть лишние атрибуты строк
            $("[style]").removeAttr("style");  // убираем внутренние стили для иконок
        },
        parserOptions: { xmlMode: true },
      })
  )
	.pipe(replace('&gt;','>')) // боремся с заменой символа 
	.pipe(
      svgSprite({
	        mode: {
	          stack: {
	            sprite: '../sprite.svg', // указываем имя файла спрайта и путь
	          },
	        },
	      })
	    )
	.pipe(dest('app/images')); // указываем, в какую папку поместить готовый файл спрайта
}

function browsersync() { // автоматическая обновление страницы при изменении  в проекте
  browserSync.init({
    server : {
      baseDir: 'app/'
    }
  });
}

function cleanDist() { // удаление из файлов из папки dist перед билдом (финалом)
  return del('dist')
}

function images() { // сжатие картинок
  return src('app/images/**/*.*')
    .pipe(imagemin(
      [
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            { removeViewBox: true },
            { cleanupIDs: false }
          ]
        })
      ]
    ))
    .pipe(dest('dist/images'))
}

function scripts() { // сжатие JS файлов и  подключение JS файлов
  return src([
    'node_modules/jquery/dist/jquery.js', // подключен jquery (можно убрать если jquery не нужен)
    'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
    'app/js/main.js' // подключен main.js
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}


function styles() { // функция конвертации sass
  return src('app/scss/style.scss')
      .pipe(scss({outputStyle: 'compressed'})) // сжатие файла css
      .pipe(concat('style.min.css')) // обяденение файлов
      .pipe(autoprefixer({ // для совместимости со старыми браузерами
        overrideBrowserslist: ['last 10 version'], // десять последних версий браузера
        grid: true // использование гридов
      }))
      .pipe(dest('app/css'))
      .pipe(browserSync.stream())
}

function build() { // финальная сборка проекта
  return src([
    'app/css/style.min.css',
    'app/fonts/**/*',
    'app/js/main.min.js',
    'app/**/*.html'
  ], {base: 'app'})
    .pipe(dest('dist'))
}

function watching() { // Слежка за изменниями в проекте
  watch(['app/scss/**/*.scss'], styles);
  watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
  watch(['app/*.html']).on('change', browserSync.reload);
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.svgSprites = svgSprites;


exports.build = series(cleanDist, images, build); // последовательность выполнения команд перед bildom (финалом)
exports.default = parallel(svgSprites, styles ,scripts ,browsersync, watching); // паралельное выполнение команд и пакетов gulpa


