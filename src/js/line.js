/**
 * line.
 */

var window = global.window,
    $ = window.$,
    mass = global.mass,
    _ = window._,
    document = window.document,
    console = window.console;

var main = {
  delete: function (lineId) {
    var cache = mass.cache,
        curLine = $('#' + lineId);
    if (curLine.hasClass('lineX')) {
      cache.lineX--;
    } else {
      cache.lineY--;
    }

    delete mass.cache.line[lineId];
    cache.focusLineId = null;

    curLine.remove();

    this.store();
    //$('#J-image-process-cover').removeClass('lineMovingX').removeClass('lineMovingY');
  },
  focus: function (lineId) {
    var cache = mass.cache,
        imgCover = $('#J-image-process-cover');

    cache.focusRectId = null;
    cache.focusTextAreaId = null;
    cache.focusLineId = lineId;
    imgCover.find('.lineX, .lineY').removeClass('line-focus');
    imgCover.find('.rect').removeClass('rect-focus');
    imgCover.find('.textzone').removeClass('textzone-focus');
    $('#' + lineId).addClass('line-focus');
  },
  /*
   * option:
   * {
   *     lineId: String, // not necessary
   *     type: String,
   *     pos: Number
   * }
   * */
  add: function (option) {
    var cache = mass.cache,
        imgCover = $('#J-image-process-cover'),
        lineuuid = cache.lineuuid,
        lineId = option.lineId,
        type = option.type,
        pos = option.pos,
        styleIn;

    if (!lineId) {
      lineId = 'line-' + lineuuid;
    }

    cache.line[lineId] = {
      type: type,
      pos: pos
    };
    cache.lineuuid++;

    if (type === 'X') {
      cache.lineX++;
      styleIn = 'top';
    } else {
      cache.lineY++;
      styleIn = 'left';
    }

    imgCover.append('<div class="line' + type + '" id="' + lineId + '" style="' + styleIn + ': ' + pos + 'px"></div>');
  },
  reset: function () {
    // 清除旧的参考线
    $('#J-image-process-cover').find('.lineX, .lineY').remove();

    $.extend(true, mass.cache, {
      focusLineId: null,
      lineuuid: 1,
      lineX: 0,
      lineY: 0
    });

    mass.cache.line = {};
  },
  // 保存切线列表
  store: function () {
    var cache = mass.cache;
    if (cache.lineX || cache.lineY) {
      window.localStorage.line = JSON.stringify(cache.line);
    }
  },
  // 批量导入切线
  import: function (lineObj, callback) {
    var cache = mass.cache,
        availableLineNum = 0,
        flowLineNum = 0;

    _.each(lineObj, function (line) {
      var type = line.type,
          pos = line.pos;

      if (type === 'X') {
        // 上次的记录中超出了图片区域
        if (pos > cache.img.height) {
          flowLineNum++;
          return;
        }
        ;
      } else {
        if (pos > cache.img.width) {
          flowLineNum++;
          return;
        }
        ;
      }

      availableLineNum++;

      main.add({
        type: type,
        pos: pos
      });
    });

    if (callback) {
      callback(availableLineNum, flowLineNum);
    }
  }
};
module.exports = main;