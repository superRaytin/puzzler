/**
 * Image Processor
 */

var window = global.window,
    $ = window.$,
    mass = global.mass,
    cache = mass.cache,
    _ = window._,
    document = window.document,
    console = window.console,
    alertify = window.alertify;

var ImageProcessor = {
    draw: function(url, options, callback) {
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
    },

    // Crop image
    crop: function(targetCanvas, x, y, width, height, imageType, quality) {

        imageType = imageType || 'image/jpeg';
        quality = quality || 0.92;

        var targetctx = targetCanvas.getContext('2d');
        var targetctxImageData = targetctx.getImageData(x, y, width, height);

        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');

        c.width = width;
        c.height = height;

        ctx.rect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.putImageData(targetctxImageData, 0, 0);

        var dataUrl = c.toDataURL(imageType, quality);

        c = ctx = null;

        return dataUrl;
    },

    cleanArea: function(targetCanvas, x, y, width, height) {
        // 获取目标画布的 context
        var ctx = targetCanvas.getContext('2d');

        // 清除像素
        ctx.clearRect(x, y, width, height);

        // 填充清除区域为白色背景
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, width, height);

        return targetCanvas;
    }
};

module.exports = ImageProcessor;