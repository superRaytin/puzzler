/**
 * custom.
 */

var window = global.window,
    $ = window.$,
    mass = global.mass,
    cache = mass.cache,
    _ = window._,
    document = window.document,
    console = window.console,
    alertify = window.alertify;

var main = {
  // 自定义内容区
  drawText: function () {
    var imgCover = $('#J-image-process-cover'),
        imgItem = imgCover.parent(),
        newTextArea = $('<div class="textzone"></div>'),
        _drawMove = false,
        _drawMoving = false,
        scrollTop = 0,
        scrollLeft = 0,
        imgWidth, imgHeight,
        left, top, distX, distY, textarea, rectCreated;

    var _rectMove = false,
        _rectMoving = false,
        rectAddX = 0,
        rectAddY = 0,
        currentRectId, trueLeft, trueTop, currentRect;

    var _rectResize = false,
        _rectResizing = false,
        trueWidth, trueHeight;

    // 点击层或resize时，将焦点放在当前的层，同时赋值基础数据
    var focusCurrentBlock = function (e, id) {
      main.focus(id);
      currentRect = cache.textArea[cache.focusTextAreaId];

      left = e.clientX - cache.minusX + imgItem.scrollLeft();
      top = e.clientY - cache.minusY + imgItem.scrollTop();
      distX = e.clientX - cache.minusX + scrollLeft;
      distY = e.clientY - cache.minusY + scrollTop;
      imgWidth = cache.img.width;
      imgHeight = cache.img.height;
      rectAddX = left - currentRect.left;
      rectAddY = top - currentRect.top;

      var $curRect = $('#' + id);
      if ($curRect.hasClass('textzone-error')) {
        $curRect.removeClass('textzone-error');
      }
    };

    imgCover.mousedown(function (e) {
      // 右键不触发
      if (e.button === 2) return;

      if (imgCover.find('textarea').is(':focus')) return;

      if (cache.drawText) {
        _drawMove = true;
        left = e.clientX - cache.minusX + imgItem.scrollLeft();
        top = e.clientY - cache.minusY + imgItem.scrollTop();
        distX = left;
        distY = top;

        imgWidth = cache.img.width;
        imgHeight = cache.img.height;
      }
    });

    $(document).mousemove(function (e) {
      if (_drawMove || _rectMove || _rectResize) {
        scrollLeft = imgItem.scrollLeft();
        scrollTop = imgItem.scrollTop();
        distX = e.clientX - cache.minusX + scrollLeft;
        distY = e.clientY - cache.minusY + scrollTop;

        distX = Math.min(distX, imgWidth - 2);
        distY = Math.min(distY, imgHeight - 2);

        var $currentRect = $('#' + currentRectId);
      }

      if (_drawMove) {
        if (!rectCreated) {
          textarea = newTextArea.clone().attr('id', 'textarea-' + cache.textAreauuid);
          imgCover.append(textarea);
          rectCreated = true;
          main.focus('textarea-' + cache.textAreauuid);

          cache.textAreauuid++;
          cache.textAreaNum++;
        }

        textarea.css({
          left: left,
          top: top,
          width: distX - left,
          height: distY - top
        });

        _drawMoving = true;
      }
      else if (_rectMove) {
        trueLeft = distX - rectAddX;
        trueTop = distY - rectAddY;

        // 子欲拖出图片区域之外，我偏不让
        // 拖到图像区域外松手时，将left值替换成边界值
        if (trueLeft > imgWidth - currentRect.width - 2) {
          trueLeft = imgWidth - currentRect.width - 2;
        } else if (trueLeft < 0) {
          trueLeft = 0;
        }

        if (trueTop > imgHeight - currentRect.height - 2) {
          trueTop = imgHeight - currentRect.height - 2;
        } else if (trueTop < 0) {
          trueTop = 0;
        }

        $currentRect.css({
          left: trueLeft,
          top: trueTop
        });

        _rectMoving = true;
      }
      else if (_rectResize) {
        trueWidth = distX - currentRect.left;
        trueHeight = distY - currentRect.top;

        // 子欲拖出图片区域之外，我偏不让
        if (trueWidth > imgWidth - currentRect.left - 2) {
          trueWidth = imgWidth - currentRect.left - 2;
        } else if (trueWidth < 10) {
          trueWidth = 10;
        }

        if (trueHeight > imgHeight - currentRect.top - 2) {
          trueHeight = imgHeight - currentRect.top - 2;
        } else if (trueHeight < 10) {
          trueHeight = 10;
        }


        $currentRect.css({
          width: trueWidth,
          height: trueHeight
        });

        // 热区设置层同步赋值
        /*if (!$currentRect.find('.setting-area').hasClass('hide')) {
         $currentRect.find('input[data-type="width"]').val(trueWidth);
         $currentRect.find('input[data-type="height"]').val(trueHeight);
         }*/

        _rectResizing = true;
      }
    }).mouseup(function (e) {
      if (_drawMove) {
        if (_drawMoving) {
          if (distX < left || distY < top) {
            main.delete(cache.focusTextAreaId);
          }
          else {
            // 超出图片区域之外，将dist值替换成边界值
            if (distX > imgWidth - 2) {
              distX = imgWidth - 2;
            }
            if (distY > imgHeight - 2) {
              distY = imgHeight - 2;
            }

            cache.textArea[cache.focusTextAreaId] = {
              left: left,
              top: top,
              width: Math.max(distX - left, 10),
              height: Math.max(distY - top, 10),
              content: ''
            };

            textarea.css('cursor', 'move').append($('#J-template-textarea').html());
          }
        }

        _drawMove = false;
        _drawMoving = false;
        rectCreated = false;
      }

      if (_rectMove) {
        if (_rectMoving) {
          cache.textArea[currentRectId].left = trueLeft;
          cache.textArea[currentRectId].top = trueTop;

          _rectMoving = false;
        }
        _rectMove = false;
      }

      if (_rectResize) {
        if (_rectResizing) {
          cache.textArea[currentRectId].width = trueWidth;
          cache.textArea[currentRectId].height = trueHeight;

          _rectResizing = false;
        }
        _rectResize = false;

        if (cache.drawText) {
          imgCover.removeClass('resizing');
        }
      }
    });

    // 文字区移动
    imgCover.delegate('.cover', 'mousedown', function (e) {
      e.stopPropagation();
      //if (e.button === 2) return;
      currentRectId = this.parentNode.id;
      focusCurrentBlock(e, currentRectId);

      _rectMove = true;
    });

    // 编辑
    imgCover.delegate('.cover', 'dblclick', function (e) {
      e.stopPropagation();
      var that = $(this),
          input = that.siblings('textarea'),
          preview_frame = that.siblings('.preview_frame'),
          edit = that.siblings('.edit_textarea'),
          setting = that.siblings('.setting_textarea');

      if (input.hasClass('hide')) {
        that.addClass('hide');
        input.removeClass('hide').focus();
        preview_frame.addClass('hide');
        setting.removeClass('hide');
        edit.addClass('hide');
      } else {
        that.addClass('hide');
        input.focus();
      }
    });

    // 失去焦点加上遮罩
    imgCover.delegate('textarea', 'blur', function (e) {
      e.stopPropagation();
      $(this).siblings('.cover').removeClass('hide');
    }).delegate('textarea', 'change', function (e) {
      var that = $(this);
      cache.textArea[that.parent().attr('id')].originContent = that.val();
      cache.textArea[that.parent().attr('id')].content = main.parseMarkdown(that.val());
    });

    // 文字区收缩
    imgCover.delegate('.resize_textarea', 'mousedown', function (e) {
      e.stopPropagation();
      currentRectId = this.parentNode.id;
      focusCurrentBlock(e, currentRectId);

      if (cache.drawText) {
        imgCover.addClass('resizing');
      }

      _rectResize = true;
    });

    // 文字区设置
    imgCover.delegate('.setting_textarea', 'mousedown', function (e) {
      e.stopPropagation();
      console.log('setting textzone');
      main.preview($(this), 'setting');
    }).delegate('.edit_textarea', 'mousedown', function (e) {
      e.stopPropagation();
      console.log('edit textzone');
      main.preview($(this), 'edit');
    });
  },
  parseMarkdown: function (content) {
    var res = '';
    window.marked(content, function (err, parsedData) {
      if (err) {
        return alertify.error('markdown解析出错，请检查', 10000);
      }
      res = parsedData;
    });

    return res;
  },
  preview: function (current, type) {
    var textzone = $('#' + cache.focusTextAreaId),
        mode = type, that;

    if (!current) {
      if (!cache.focusTextAreaId) return;
      if (textzone.find('.setting_textarea').hasClass('hide')) {
        that = textzone.find('.edit_textarea');
        mode = 'edit';
      } else {
        that = textzone.find('.setting_textarea');
        mode = 'setting';
      }
    } else {
      that = current;
    }

    var preview_frame = that.siblings('.preview_frame'),
        input = that.siblings('textarea'),
        cover = that.siblings('.cover'),
        value = input.val(),
        frame = preview_frame.find('iframe');

    // 预览
    if (mode === 'setting') {
      that.addClass('hide');
      input.addClass('hide');

      that.siblings('.edit_textarea').removeClass('hide');
      preview_frame.removeClass('hide');

      frame.contents().find('body').html(main.parseMarkdown(value));
    }
    // 编辑
    else if (mode === 'edit') {
      that.addClass('hide');
      input.removeClass('hide');

      that.siblings('.setting_textarea').removeClass('hide');
      preview_frame.addClass('hide');
    }

  },
  focus: function (textAreaId) {
    var imgCover = $('#J-image-process-cover');

    cache.focusTextAreaId = textAreaId;
    cache.focusLineId = null;
    cache.focusRectId = null;
    imgCover.find('.lineX, .lineY').removeClass('line-focus');
    imgCover.find('.rect').removeClass('rect-focus');
    imgCover.find('.textzone').removeClass('textzone-focus');
    $('#' + textAreaId).addClass('textzone-focus');
  },
  reset: function () {
    $('#J-image-process-cover').find('.textzone').remove();

    $.extend(true, mass.cache, {
      textAreauuid: 1,
      textAreaNum: 0,
      focusTextAreaId: null
    });

    cache.textArea = {};
  },
  /*
   * option:
   * {
   *     left: Number,
   *     top: Number,
   *     width: Number,
   *     height: Number,
   *     content: String
   * }
   * */
  add: function (option) {
    var textAreauuid = cache.textAreauuid,
        rectId = 'textarea-' + textAreauuid,
        imgCover = $('#J-image-process-cover'),
        rectEntry = $('<div class="textzone"></div>'),
        resizeZone = $('#J-template-textarea').html(),
        currentStyles;

    currentStyles = {
      left: option.left,
      top: option.top,
      width: option.width,
      height: option.height,
      cursor: 'move'
    };

    rectEntry.attr('id', rectId).css(currentStyles).append(resizeZone);
    rectEntry.find('textarea').val(option.originContent);
    imgCover.append(rectEntry);

    cache.textAreauuid++;
    cache.textAreaNum++;
    cache.textArea[rectId] = option;
  },
  delete: function (textAreaId) {
    var curTextArea = $('#' + textAreaId);

    cache.textAreaNum--;

    delete mass.cache.textArea[textAreaId];
    cache.focusTextAreaId = null;

    curTextArea.remove();
  },
  // 批量导入
  import: function (options, callback) {
    _.each(options, function (item) {
      main.add(item);
    });

    if (callback) {
      callback();
    }
  },
  // 检查文字区位置
  check: function () {
    var lines = cache.line,
        rects = cache.textArea,
        isBig2 = !!(cache.img.width > 990 && cache.lineY > 1),
        critical = {
          X: {},
          Y: {}
        },
        rectInBlock = {},
        blocks,
        res = true;

    if (!cache.textAreaNum) return res;

    $('.textzone').removeClass('textzone-error');

    $.each(rects, function (rectId, rect) {
      critical.Y.x = rect.left;
      critical.Y.y = rect.left + rect.width;
      critical.X.x = rect.top;
      critical.X.y = rect.top + rect.height;
      $.each(lines, function (lineId, line) {
        var type = line.type,
            pos = line.pos;

        if (pos > critical[type].x && pos < critical[type].y) {
          res = false;
          console.log(rectId, type, critical);
          console.log(lineId, pos);
          console.log('--------');
          $('#' + rectId).addClass('textzone-error');
        }
      });
    });

    if (res) {
      if (isBig2) {
        blocks = mass.getCutBlocks('children');

        $.each(blocks, function (i, block) {
          var blockParentIndex = block.parentBlockIndex;
          $.each(rects, function (rectId, rect) {
            var topAndSelfHeight = block.y + block.height,
                leftAndSelfWidth = block.x + block.width;

            if (block.width > rect.width && block.x < rect.left && block.y < rect.top && (topAndSelfHeight > rect.top + rect.height) && (leftAndSelfWidth > rect.left + rect.width)) {
              rectInBlock[blockParentIndex] = rectInBlock[blockParentIndex] || [];
              rectInBlock[blockParentIndex].push({
                rect: rect,
                left: rect.left - block.x,
                top: rect.top - block.y,
                belongBlockIndex: block.index
              });
            }
          });
        });
      }
      else {
        blocks = mass.getCutBlocks();

        $.each(blocks, function (i, block) {
          $.each(rects, function (rectId, rect) {
            var topAndSelfHeight = block.y + block.height,
                leftAndSelfWidth = block.x + block.width;

            if (block.width > rect.width && block.x < rect.left && block.y < rect.top && (topAndSelfHeight > rect.top + rect.height) && (leftAndSelfWidth > rect.left + rect.width)) {
              rectInBlock[i] = rectInBlock[i] || [];
              rectInBlock[i].push({
                rect: rect,
                left: rect.left - block.x,
                top: rect.top - block.y
              });
            }
          });
        });
      }
    }
    console.log(rectInBlock);
    cache.textAreaInBlock = rectInBlock;

    return res;
    //return false;
  },
  // 查看HTML源代码
  previewHTML: function () {
    var currentTextarea = $('#' + cache.focusTextAreaId),
        value = currentTextarea.find('textarea').val();
    mass.dialog(main.parseMarkdown(value).replace(/</mg, '&lt;').replace(/>/mg, '&gt;'), true);
  }
};

module.exports = main;