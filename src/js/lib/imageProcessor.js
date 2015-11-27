/**
 * Image Processor
 */

var window = global.window,
    document = window.document,
    console = window.console;

var Buffer = global.Buffer;
var fs = global.require('fs');

// constructor
function ImageProcessor(image, options) {
    this.initialize(image, options);
}

// init setter
initSetter(ImageProcessor);

// initialize
ImageProcessor.prototype.initialize = function(image, options) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    image = image || this.originalImage;

    var width = image.width;
    var height = image.height;
    var imageUrl = image.getAttribute('src');

    options = options || {};

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    this.canvas = canvas;
    this.imageFormat = options.imageFormat || getImageFormat(imageUrl);
    this.qualityLevel = options.quality || 0.92;

    if (!this.originalImage) {
        this.originalImage = image;
    }

    return this;
};

// initialize
ImageProcessor.prototype.reset = function() {
    return this.initialize();
};

// draw image to canvas
ImageProcessor.prototype.draw = function(url, options, callback) {
    options = options || {};

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var image = new Image();
    var qualityNum = options.quality || 0.92;
    var imageType = options.imageType || 'image/jpeg';

    var sx = options.sx;
    var sy = options.sy;
    var sWidth = options.sWidth;
    var sHeight = options.sHeight;
    var dWidth = options.dWidth;
    var dHeight = options.dHeight;
    var dx = options.dx;
    var dy = options.dy;

    image.onload = function() {
        canvas.width = sWidth;
        canvas.height = sHeight;

        ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        var dataUrl = canvas.toDataURL(imageType, qualityNum);

        callback && callback(dataUrl);
    };

    image.src = url;
};

// crop image
ImageProcessor.prototype.crop = function(x, y, width, height, callback) {
    var imageFormat = this.imageFormat;
    var quality = this.qualityLevel;

    var canvas = this.canvas;
    var ctx = canvas.getContext('2d');

    // 取出要裁切的画布像素数据
    var imageData = ctx.getImageData(x, y, width, height);

    // 创建临时画布放置裁切出来的像素数据
    var tempcanvas = document.createElement('canvas');
    var tempctx = tempcanvas.getContext('2d');

    tempcanvas.width = width;
    tempcanvas.height = height;

    tempctx.rect(0, 0, width, height);
    tempctx.fillStyle = 'white';
    tempctx.fill();
    tempctx.putImageData(imageData, 0, 0);

    var dataUrl = tempcanvas.toDataURL(imageFormat, quality);

    tempcanvas = tempctx = null;

    callback(dataUrl);
};

// convert dataurl to binary image file
ImageProcessor.prototype.toFile = function(path, dataUrl, callback) {

    if (arguments.length === 2) {
        callback = dataUrl;
        dataUrl = this.toDataUrl();
    }

    var imgbase64 = dataUrl.replace('data:image/jpeg;base64,', '')
        .replace('data:image/jpg;base64,', '')
        .replace('data:image/png;base64,', '');

    var dataBuffer = new Buffer(imgbase64, 'base64');

    // create image file
    fs.writeFile(path, dataBuffer, function(err) {
        if (err) {
            return console.log(err);
        }

        callback();
    });
};

// convert to data url
ImageProcessor.prototype.toDataUrl = function(quality) {
    quality = quality || this.quality;

    var canvas = this.canvas;
    var imageFormat = this.imageFormat;

    return canvas.toDataURL(imageFormat, quality);
};

// clear canvas
ImageProcessor.prototype.clear = function() {
    var canvas = this.canvas;

    this.cleanArea(0, 0, canvas.width, canvas.height);

    return this;
};

ImageProcessor.prototype.cleanArea = function(x, y, width, height) {
    var canvas = this.canvas;
    // 获取目标画布的 context
    var ctx = canvas.getContext('2d');

    // 清除像素
    ctx.clearRect(x, y, width, height);

    // 填充清除区域为白色背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, width, height);

    return this;
};

// set quality
ImageProcessor.prototype.quality = function(level) {
    level = parseFloat(level);

    // 0.01 ~ 0.92
    level = level > 0.92 ? 0.92 : level < 0.01 ? 0.01 : level;

    this.qualityLevel = level;

    return this;
};

ImageProcessor.prototype.destroy = function() {
    this.canvas = null;
};

// initialize setter
function initSetter(construct) {
    var keys = ['imageFormat'];

    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];

        (function(k) {
            construct.prototype['set' + upperCase(k)] = function(v) {
                this[k] = v;
            };
        })(key);
    }
}

// get image format
function getImageFormat(str) {
    var format = str.substr(str.lastIndexOf('.') + 1, str.length);

    // 震惊：image/jpg 切出来的图片文件比 image/jpeg 大将近 10 倍！
    format = format === 'jpg' ? 'jpeg' : format;

    return 'image/' + format;
}

// uppercase first
function upperCase(str) {
    return str.replace(str.charAt(0), function(a) {
        return a.toUpperCase();
    });
}

module.exports = ImageProcessor;