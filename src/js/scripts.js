/**
 * scripts.
 */

var cheerio = require('cheerio');

var gui = require('nw.gui');
var fs = require('fs');
var modPath = require('path');
var Slices = require('slices');
var imageToSlices = require('image-to-slices');
var Clipper = require('image-clipper');

var template = require('./js/template');
var config = require('./js/config');

global.gui = gui;
global.$ = $;

var Utils = require('./js/lib/utils');

// 滚动条 Y 的宽度
var scrollYWidth = 11;

// 滚动条 X 的高度
var scrollXHeight = 11;

// 工具栏高度
var toolbarHeight = 50;

// 标尺 X 轴高度
var ruleXHeight = 20;

// 标尺 Y 轴宽度
var ruleYWidth = 20;

// 状态栏高度
var statusBarHeight = 20;

var mass = {
  states: {},

  cache: {
    minusX: 20, // 标尺X的宽度
    minusY: 70, // 工具栏高度加标尺Y的高度
    statusHeight: 20,
    wrapperWidth: 990, // 外框宽度
    // 参考线缓存, 格式: {[lineId]: { type: 'X', pos: 123 }}
    line: {},
    focusLineId: null,
    lineuuid: 1,
    lineX: 0,
    lineY: 0,
    rect: {},
    rectNum: 0,
    rectuuid: 1,
    focusRectId: null,
    textArea: {},
    textAreaNum: 0,
    textAreauuid: 1,
    focusTextAreaId: null,
    shouldResizeImageWrapper: false,
    // 与 package.json 中的设置保持一致
    minWidth: 700,
    minHeight: 500,
    // 图片质量
    imageQuality: 75
  },

  sectionAdapter: {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen'
  },

  reg: {
    imgFile: /^(jpg|jpeg|png)$/i
  },

  resizeHandler: function () {
    var cache = mass.cache,
        back = $('#backing'),
        mainRight = $('.main_right'),
        $image = $('#J-image'),
        imageWrapper = $image.parent(),
        addImg = $('.addImg'),
        hadSelectedImg = addImg.hasClass('hide');

    var win = $(window);
    var winWidth = win.width();
    var winHeight = win.height();

    // 图片之外的区域高度
    var imageOutsideAreaHeight = toolbarHeight + ruleXHeight + statusBarHeight;

    // 背景层
    back.width(winWidth).height(winHeight);
    back.find('img').width(winWidth).height(winHeight);

    // 未添加图片时，按钮居中显示
    if (!hadSelectedImg) {
      addImg.css({
        left: (mainRight.width() - 200) / 2,
        top: (mainRight.height() - 60) / 2
      });
    }

    // 同步修改图片区外层宽度和高度
    if (cache.shouldResizeImageWrapper) {
      imageWrapper.width(Math.min(cache.img.width + scrollYWidth, winWidth - scrollYWidth));
      imageWrapper.height(Math.min(cache.img.height + scrollXHeight, winHeight - imageOutsideAreaHeight));
    }
  },

  // 初始化图片处理层
  // 每次重新选择图片都需要初始化
  initImageProcessCover: function () {
    var cache = this.cache;
    var imageWrapper = $('#J-image-wrapper');
    var img = $('#J-image');
    var imageWidth = img.width();
    var imageHeight = img.height();

    $('#J-image-process-cover').width(imageWidth).height(imageHeight);

    var win = $(window);
    var winWidth = win.width();
    var winHeight = win.height();

    // 图片之外的区域高度
    var imageOutsideAreaHeight = toolbarHeight + ruleXHeight + statusBarHeight;

    // 图片区域高度
    var imageAreaHeight = winHeight - imageOutsideAreaHeight;

    // 确保图片外层滚动条在正确位置
    imageWrapper.width(Math.min(imageWidth + scrollYWidth, winWidth - scrollYWidth));
    imageWrapper.height(Math.min(imageHeight + scrollXHeight, imageAreaHeight));

    // 图片的宽度大于窗口可能的最小宽度（配置中的 min_width）
    // 或者图片的高度大于窗口可能的最小高度（配置中的 min_height）
    // 则在 resize 触发时需要同时修改图片外层的宽度和高度（为了保证滚动条正确出现）
    // 否则 resize 时不需要同时修改
    if (imageWidth + scrollYWidth > cache.minWidth - ruleYWidth || imageHeight + scrollXHeight > cache.minHeight - imageOutsideAreaHeight) {
      cache.shouldResizeImageWrapper = true;
    }
  },

  // 遮罩
  overlay: function (type) {
    var dom = $('#overlay');
    if (type === 'show') {
      dom.show();
    } else {
      dom.hide();
    }
  },

  // 处理拖拽文件至窗口
  dropFile: function () {
    var self = this;
    var wrapper = document.getElementById('wrapper');

    wrapper.ondragover = function (e) {
      e.preventDefault();
    };

    wrapper.ondrop = function (e) {
      e.preventDefault();
      self.dealDrop(e);
    };
  },

  // 处理拖拽进来的文件
  dealDrop: function (e) {
    var self = this;
    var file = e.dataTransfer.files[0];

    if (!file) return;

    var fileFormat = Utils.getFileFormat(file.name);

    if (self.reg.imgFile.test(fileFormat)) {
      self.cache.fileFormat = fileFormat;
      $('#J-Calculate').attr('src', file.path);
    } else {
      console.log(file.path + ' 文件不符合格式');
      self.dialog('请选择 jpg、jpeg 或 png 格式的文件', true);
    }
  },

  // 设置
  rockSettings: {
    // 显示界面之前初始化
    init: function () {
      var cache = mass.cache;

      var localSetting = localStorage.setting,
          setting = localSetting ? $.extend(true, config.setting, JSON.parse(localSetting)) : config.setting;

      // 加载设置项 push到设置各表单值
      $('#dialogWrap').find('.column_checkbox, .column_radio, .column_select, .column_input, .column_textarea').each(function () {
        var that = $(this),
            name = that.attr('data-name'),
            value = this.value,
            belong = that.attr('data-belong'),
            type = that.attr('type') ? that.attr('type') : this.tagName.toLowerCase(),
            valueInSet = belong ? setting[belong][name] : setting[name];

        if (!name) return;

        if (type === 'checkbox') {
          this.checked = valueInSet;
        }
        else if (type === 'radio') {
          if (valueInSet === value) {
            this.checked = true;
          }
          if (value === 'custom') {
            that.next().find('.column_input').val(setting[belong].path);
          }
        }
        else if (type === 'select') {
          that.val(valueInSet);
        }
        else if (type === 'text' || type === 'password') {
          this.value = valueInSet;
        } else if (name === 'template') {
          if (cache.isBig) {
            if (cache.lineY > 1) {
              this.value = valueInSet.big2;
              $('#width_big2').trigger('click');
            } else {
              this.value = valueInSet.big;
              $('#width_big').trigger('click');
            }
          } else {
            this.value = valueInSet.small;
          }
        }
      });
    },
    // 监听设置中的用户交互
    listen: function () {
      var cache = mass.cache,
          dialogWrap = $('#dialogWrap'),
          tabCon = dialogWrap.find('.tab_content');

      var userSet = this.userSet;

      // tab切换
      dialogWrap.find('.tab_tigger_item').on('click', function (e) {
        var that = $(this),
            index = that.index();

        if (that.hasClass('on')) return;
        $('.tab_tigger_item').eq(index).addClass('on').siblings().removeClass('on');
        $('.tab_content_item').eq(index).removeClass('hide').siblings().addClass('hide');
      });

      // 自定义保存目录
      dialogWrap.find('.J-filePath_custom').click(function () {
        var setting_savePath = userSet.setting.savePath,
            input = $(this),
            hiddenFile = input.next();

        hiddenFile.trigger('click').on('change', function () {
          if (this.value != '') {
            input.val(this.value);
            setting_savePath.mode = 'custom';
            setting_savePath.path = this.value;
          }
        });
      });

      // checkbox | radio | select | textarea
      tabCon.find('.column_checkbox, .column_radio, .column_select').on('change', function (e) {
        var that = $(this),
            name = that.attr('data-name'),
            noclick = that.attr('data-noclick'),
            belong = that.attr('data-belong'),
            value = this.value;

        if (!name || noclick) return;

        if (that.is(':checkbox')) {
          value = this.checked;
        }

        console.log('change:crs')
        if (belong) {
          userSet.setting[belong][name] = value;
          //space.saveItem(name, this.checked, belong);
        } else {
          userSet.setting[name] = value;
          //space.saveItem(name, this.checked);
        }
      });

      // 切换模板
      $('.column_radio_template').on('change', function () {
        var localSetting = localStorage.setting,
            setting = localSetting ? $.extend(true, config.setting, JSON.parse(localSetting)) : config.setting;

        $('#J-templateArea').val(setting.template[this.value]);
      });
      $('#J-templateArea').on('change', function () {
        var checked = $('.column_radio_template:checked').val(),
            setting_template = userSet.setting.template;

        setting_template[checked] = this.value;
      });

      // 模板重置
      $('#J-template-reset').click(function () {
        mass.confirmy('将会重置模板配置，此操作不可逆，确定吗？', function () {
          mass.templateReset();
        }, false);
      });
    },
    userSet: {
      setting: {
        template: {},
        savePath: {}
      }
    },
    // 验证
    validate: function () {
      return true;
    },
    // 保存所有设置
    saveAllSetting: function () {
      if (!this.validate()) return false;
      var setting = window.localStorage.setting ? JSON.parse(window.localStorage.setting) : {};

      $.extend(true, setting, this.userSet.setting);
      console.log(setting);
      window.localStorage.setting = JSON.stringify(setting);

      // 改变了标尺选项，重新渲染标尺区域
      if (this.userSet.setting.ruler_show !== undefined || this.userSet.setting.ruler_step !== undefined) {
        mass.ruler_convert();
      }

      return true;
    },
    // 取得本地设置指定项
    getItemInSetting: function (key, belong) {
      var localSet = window.localStorage.setting,
          setting, res = false;

      if (localSet) {
        setting = config.setting;

        $.extend(true, setting, JSON.parse(localSet));

        if (belong && setting[belong]) {
          res = setting[belong][key];
        } else {
          res = setting[key];
        }
      } else {
        if (belong && config.setting[belong]) {
          res = config.setting[belong][key];
        } else {
          res = config.setting[key];
        }
      }

      return res;
    },
    // 获取具体的打开时路径
    getDetailPath: function () {
      var mode = mass.rockSettings.getItemInSetting('mode', 'savePath');
      var res;

      if (mode === 'last') {
        res = mass.rockSettings.itemInMemory('lastDirectory');
      }
      else if (mode === 'custom') {
        res = mass.rockSettings.getItemInSetting('path', 'savePath');
      }

      console.log('detail path: ' + res);
      return res;
    },
    // 获取/设置 memory中子项
    itemInMemory: function (key, value) {
      var localMemory = window.localStorage.memory,
          memory, res = false;

      if (localMemory) {
        memory = JSON.parse(localMemory);
        if (value !== undefined) {
          memory[key] = value;
        } else {
          res = memory[key];
        }
      } else {
        if (value !== undefined) {
          memory = {};
          memory[key] = value;
        }
      }

      if (value === undefined) {
        return res;
      } else {
        window.localStorage.memory = JSON.stringify(memory);
      }
    }
  },

  // 导入导出用户设置
  exportUserSetting: function () {
    if (window.localStorage.setting) {
      $('#J-hi-saveDiretoryForUserExport').trigger('click');
    } else {
      alertify.log('没有任何用户设置可导出。');
    }
  },

  importUserSetting: function () {
    $('#J-hi-saveDiretoryForUserImport').trigger('click');
  },

  // 标尺
  ruler: function () {
    var offsetWrap = $('#J-offset'),
        imgCover = $('#J-image-process-cover'),
        imageWrapper = imgCover.parent(),
        cache = this.cache,
        scrollTop = 0,
        scrollLeft = 0;

    var _move = false,
        _moved = false,
        currentMoveLineId = null,
        minusY = cache.minusY,
        minusX = cache.minusX,
        pos = 0,
        _type;

    $('.ruler-x, .ruler-y').mousedown(function (e) {
      if (!$('.addImg').hasClass('hide')) return;
      var that = $(this),
          type = that.data('type');

      _type = type;
      _move = true;
      imgCover.addClass('lineMoving' + type);
    });

    // 刻度切换
    this.ruler_convert();

    $(document).mousemove(function (e) {
      if (_move) {
        scrollTop = imageWrapper.scrollTop();
        scrollLeft = imageWrapper.scrollLeft();
        if (_type === 'X') {
          if (e.clientY > minusY) {
            // 边界控制
            if (e.clientY + scrollTop > minusY + cache.img.height - 4) return;

            // 不是移动现有参考线，则新建一根
            if (!currentMoveLineId) {
              var line = $('<div class="lineX" id="line-' + cache.lineuuid + '"></div>');
              imgCover.append(line);
              currentMoveLineId = 'line-' + cache.lineuuid;
              cache.lineuuid++;
              cache.lineX++;
            }

            pos = e.clientY + scrollTop - minusY;

            $('#' + currentMoveLineId).css('top', pos);
          }
        }
        else if (_type === 'Y') {
          if (e.clientX > minusX) {
            // 边界控制
            if (e.clientX + scrollLeft > minusX + cache.img.width - 4) return;

            // 不是移动现有参考线，则新建一根
            if (!currentMoveLineId) {
              var line = $('<div class="lineY" id="line-' + cache.lineuuid + '"></div>');
              imgCover.append(line);
              currentMoveLineId = 'line-' + cache.lineuuid;
              cache.lineuuid++;
              cache.lineY++;
            }

            pos = e.clientX + scrollLeft - minusX;

            $('#' + currentMoveLineId).css('left', pos);
          }
        }
        _moved = true;
        offsetWrap.val(pos);
      }
    }).mouseup(function (e) {
      if (_move) {
        if (_moved) {
          // 删除参考线
          if ((_type === 'X' && e.clientY < minusY) || (_type === 'Y' && e.clientX < minusX)) {
            mass.Line.delete(currentMoveLineId);
          }
          else {
            // 把line 的偏移量存起来
            cache.line[currentMoveLineId] = {
              type: _type,
              pos: pos
            };

            mass.Line.focus(currentMoveLineId);

            // 把参考线的信息保存到本地
            mass.Line.store();
          }
        }
        imgCover.removeClass('lineMoving' + _type);

        _move = false;
        _moved = false;
        currentMoveLineId = null;
      }
    });

    // 参考线选中操作
    imgCover.delegate('.lineX, .lineY', 'mousedown', function (e) {
      e.stopPropagation();

      var that = $(this),
          lineId = that.attr('id');

      mass.Line.focus(lineId);
      var cacheLine = cache.line[lineId];

      currentMoveLineId = lineId;
      _type = cacheLine.type;
      _move = true;

      offsetWrap.val(cacheLine.pos);

      imgCover.addClass('lineMoving' + _type);
    });
  },

  ruler_convert: function () {
    var scale = $('.scale'),
        scaleNum = 0,
    // 标尺步长
        scaleStep = parseInt(mass.rockSettings.getItemInSetting('ruler_step')),
        scaleIsShow = mass.rockSettings.getItemInSetting('ruler_show');

    scaleIsShow = scaleIsShow === true || scaleIsShow === 'true';

    if (scaleIsShow) {
      $('.ruler-x, .ruler-y').html('');

      for (scaleNum = 0; scaleNum < screen.availWidth; scaleNum += scaleStep) {
        $('.ruler-x').append('<span class="scale" style="left: ' + (scaleNum + 2) + 'px;">' + scaleNum + '</span>');
      }

      for (scaleNum = 0; scaleNum < screen.availHeight; scaleNum += scaleStep) {
        $('.ruler-y').append('<span class="scale" style="top: ' + (scaleNum + 0) + 'px">' + scaleNum + '</span>');
      }
    }
    else {
      if (scale.length) {
        scale.hide();
      }
    }
  },

  // 对话框
  dialog: function (msg, buttons) {
    var title = '提 示';

    var opt = {
      title: title,
      content: msg,
      lock: true,
      resize: false,
      initialize: function () {
        mass.dialog_commonInit();
      }
    };

    if (typeof msg === 'object') {
      opt.title = msg.title || title;
      opt.content = msg.content;
      if (msg.width) {
        opt.width = msg.width;
      }
      if (msg.height) {
        opt.height = msg.height;
      }
    }

    if (buttons !== undefined) {
      opt.button = buttons === true ? [
        {
          value: '确定',
          callback: function () {
          },
          focus: true
        }
      ] : buttons;
    }
    console.log('dialog: ' + msg);
    return $.artDialog(opt);
  },

  dialog_commonInit: function () {
    var dialogParent = $('.d-outer').parent();

    $('#wrapper').append(dialogParent).append($('.d-mask'));

    dialogParent.find('.d-button').addClass('custom-appearance');
  },

  /*
   * content: 文本
   * callback: 点击确定回调
   * fade: 淡出效果，默认淡出，传入false按正常效果
   * */
  confirmy: function (content, callback, fade) {
    $.artDialog({
      title: '请确认',
      content: content,
      lock: true,
      resize: false,
      button: [
        {
          value: '确 定',
          callback: function () {
            callback();
          }
        },
        {
          value: '取 消',
          focus: true
        }
      ],
      initialize: function () {
        mass.dialog_commonInit();
        var dialogParent = $('.d-outer').parent();

        $('.dialogWrap').parent().css('padding', 0);

        if (fade === undefined) {
          dialogParent.hide();
          dialogParent.fadeIn(300);
        }
      }
    });
  },

  // 获取排好序的X Y坐标
  getSortPos: function (type) {
    var res = [],
        lineHash = {};
    $.each(mass.cache.line, function (key, line) {
      if (line.type === type) {
        // 过滤重合的参考线
        if (lineHash[type + '' + line.pos]) {
          mass.Line.delete(key);
        } else {
          res.push(line.pos);
          lineHash[type + '' + line.pos] = true;
        }
      }
    });
    return res.sort(function (a, b) {
      return a - b > 0
    });
  },

  reset: function (shouldResizeImageWrapper) {
    this.Line.reset();
    this.Rect.reset();
    this.TextArea.reset();

    if (shouldResizeImageWrapper) {
      this.cache.shouldResizeImageWrapper = false;
    }

    this.cache.clipboard = null;
    $('#J-copyCode').addClass('hide');
  },

  templateReset: function () {
    var setting = window.localStorage.setting ? JSON.parse(window.localStorage.setting) : {};
    if (!setting.template) {
      setting.template = {};
    }
    $.extend(true, setting.template, {
      small: template.style,
      big: template.styleBig,
      big2: template.styleBig2
    });

    $('#J-templateArea').val(setting.template[$('.column_radio_template:checked').val()]);
    window.localStorage.setting = JSON.stringify(setting);

    mass.rockSettings.userSet.setting = {
      template: {},
      savePath: {}
    };

    alertify.success('模板恢复成功。');
  },

  // 初始化图片预览区
  // 每次重新选择图片都会执行
  initImagePreview: function (reset) {
    var cache = this.cache,
        addImg = $('.addImg'),
        $image = $('#J-image'),
        imageWrapper = $image.parent(),
        imgCover = $('#J-image-process-cover'),
        statusInner = $('#J-statusBar-inner'),
        offset = $('#J-offset'),
        imgInfo = $('#J-imgInfo');

    this.reset(true);

    if (reset) {
      addImg.removeClass('hide');
      statusInner.addClass('hide');

      $image.remove();
      imgCover.removeAttr('style');
      imageWrapper.removeAttr('style');
    } else {
      !addImg.hasClass('hide') && addImg.addClass('hide');

      if (statusInner.hasClass('hide')) {
        statusInner.removeClass('hide');
      }
      // 改变状态栏偏移量的值
      offset.val(0);
      imgInfo.text(cache.img.width + ' X ' + cache.img.height + ' --- ' + $image.attr('src'));
    }
  },

  // 拉取最后一次的参考线记录
  getLastLines: function () {
    var localLine = window.localStorage.line,
        cache = mass.cache,
        lineObj;

    if (!cache.img) return;

    if (!localLine) {
      return alertify.log('没有参考线记录。');
    }

    if (cache.lineX || cache.lineY) {
      if (!window.confirm('检测到当前已有参考线存在，此操作将会清空目前的参考线，确定吗？')) {
        return;
      }

      mass.Line.reset();
    }

    lineObj = JSON.parse(localLine);

    mass.Line.import(lineObj, function (availableLineNum, flowLineNum) {
      // 上次所有参考线都超出了当前图片区域
      if (availableLineNum == 0) {
        return alertify.log('所有参考线记录都超出了当前图片区域，此次操作无效。', 'error', 10000);
      }
      else if (flowLineNum) {
        alertify.log('记录应用成功。但记录中有 ' + flowLineNum + ' 条参考线超出当前图片范围，已失效。', '', 10000);
      }
      mass.Line.store();
    });
  },

  // 工具栏下拉菜单
  dropMenu: function (e) {
    var target = $(e.target),
        type = target.data('type'),
        param = target.data('param');

    if (type) {
      mass[type](param);
    }
  },

  // 黄金分割
  golden_section: function (param) {
    var cache = mass.cache,
        img = cache.img,
        imgCover = $('#J-image-process-cover'),
        ylines = mass.getSortPos('Y'),
        lineY = cache.lineY,
        //lineuuid = cache.lineuuid,
        pendLine = [],
        temp = [];

    if (!img) return;

    if (img.width < 990) {
      return alertify.log('图片宽度少于 990 像素就算了吧~', 'error', 5000);
    }

    // 自定义
    if (param === 'custom') {
      var val = window.prompt('请输入');
      console.log(val);

      if (val === null) return;

      if (val < 10) {
        return alertify.log('至少给个 10 像素吧~', 'error', 5000);
      }

      param = parseInt(val);

      // 记住自定义设置的黄金比例值
      cache.wrapperWidth = param;
    }

    pendLine.push({
      pos: (img.width - param) / 2,
      type: 'Y'
    });
    pendLine.push({
      pos: (img.width - param) / 2 + param,
      type: 'Y'
    });

    _.each(pendLine, function (line) {
      var lineuuid = cache.lineuuid++;
      temp.push('<div class="lineY" id="line-' + lineuuid + '" style="left: ' + line.pos + 'px"></div>');
      cache.line['line-' + lineuuid] = {
        type: 'Y',
        pos: line.pos
      }
    });

    imgCover.append(temp.join(''));

    cache.lineY = lineY + 2;
    //cache.lineuuid = lineuuid + 3;
  },

  // 选择图片时触发
  imageChangeHandler: function () {
    var self = this;

    self.initImagePreview();
    self.initImageProcessCover();

    self.cache.isBig = self.cache.img && self.cache.img.width > 990;
    self.cache.quickSavePath = null;

    // 初始化画布
    self.initCanvas();

    self.checkConfigFile();
  },

  // 检查图片配置文件 - 有则导入
  checkConfigFile: function () {
    var cache = mass.cache,
        img = cache.img,
        imgDirectory = modPath.dirname(img.path);
    var configPath = modPath.join(imgDirectory, 'config.json');

    if (fs.existsSync(configPath)) {
      alertify.log('检测到配置文件，已自动适配：' + configPath);
      fs.readFile(configPath, function (err, data) {
        if (err) {
          return mass.dialog('配置文件读取错误！<br>' + err, true);
        }

        var decodeData = Utils.str_decode(data);

        if (decodeData === 'error') {
          mass.dialog('配置文件解析出错！请检查文件编码类型', true);
          return;
        }

        var parseData;

        try {
          parseData = JSON.parse(decodeURIComponent(decodeData));
        } catch (e) {
          mass.dialog('配置文件解析出错！是不是修改过配置文件？请检查是否正确的 JSON 格式<br>' + e, true);
          return console.log(e);
        }

        // 导入参考线
        mass.Line.import(parseData.line, function (availableLineNum, flowLineNum) {
          // 上次所有参考线都超出了当前图片区域
          if (availableLineNum == 0) {
            return mass.dialog('所有参考线都超出了当前图片区域，此次操作无参考线导入，是不是修改过 origin 图片或配置文件？', true);
          }
          else if (flowLineNum) {
            mass.dialog('导入成功，但有 ' + flowLineNum + ' 条参考线超出当前图片范围，已失效，是不是修改过 origin 图片或配置文件？', true);
          }
          mass.Line.store();
        });

        // 导入热区
        mass.Rect.import(parseData.rect);

        // 导入文字区
        mass.TextArea.import(parseData.textArea);

        cache.quickSavePath = imgDirectory;
      });
    }
  },

  // 是否中间分割模式
  isMiddleBoundaryMode: function() {
    var cache = mass.cache;
    var lineYLength = cache.lineY;
    var imageWidth = cache.img.width;

    var result = !!(imageWidth > 990 && lineYLength > 1);

    return result;
  },

  // 获取切片
  getCutBlocks: function() {
    var cache = mass.cache;
    var imageWidth = cache.img.width;
    var imageHeight = cache.img.height;

    var lineXArray = mass.getSortPos('X');
    var lineYArray = mass.getSortPos('Y');

    var isMiddleBoundaryMode = this.isMiddleBoundaryMode();

    var blocks = Slices(imageWidth, imageHeight, lineXArray, lineYArray, {
      middleBoundaryMode: isMiddleBoundaryMode
    });

    return blocks;
  },

  getChildBlocks: function() {
    var blocks = this.getCutBlocks();
    var isMiddleBoundaryMode = this.isMiddleBoundaryMode();
    var result = [];

    if (isMiddleBoundaryMode) {
      $.each(blocks, function(i, block) {
        result = result.concat(block.children);
      });
    }

    return result;
  },

  // 获取导出路径
  getExportPath: function(dir, willExportHtml) {
    var cache = this.cache;
    var newFolder = this.rockSettings.getItemInSetting('exportOption');
    var exportPath = dir;

    // 快捷导出
    if (cache.quickSavePath && willExportHtml) {
      // 用户设置了快捷导出目录
      exportPath = cache.quickSavePath;
    }
    else {
      // 根据用户设置是否创建新文件夹存放
      if (newFolder && newFolder === 'newfolder') {

        // 得到图片名称
        // ('path/to/aaa.jpg', '.jpg') => 'aaa'
        var imageName = modPath.basename(cache.img.path, '.' + cache.fileFormat);

        var exportPathByImgName = modPath.join(exportPath, imageName);

        // 没有此图片名称命名的文件夹，则新建一个
        if (!fs.existsSync(exportPathByImgName)) {
          fs.mkdirSync(exportPathByImgName);
        }

        exportPath = exportPathByImgName;
      }
    }

    return exportPath;
  },

  clipImage: function(dir, callback) {
    alertify.log('正在导出切片...');

    var self = this;
    var willExportHtml = !!callback;
    var exportPath = this.getExportPath(dir, willExportHtml);

    // 保存锁，避免疯狂保存的情况
    self.cache.saveLock = true;

    var folder = '';
    if (willExportHtml) {
      folder = 'images';
    }

    exportPath = modPath.join(exportPath, folder);

    // 不存在 images 文件夹就新建一个
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath);
    }

    var $image = $('#J-image');
    var imagePath = $image.attr('src');

    var lineXArray = mass.getSortPos('X');
    var lineYArray = mass.getSortPos('Y');
    var isMiddleBoundaryMode = this.isMiddleBoundaryMode();
    var imageQuality = this.cache.imageQuality;
    var fileFormat = this.cache.fileFormat;

    function afterSliced() {
      if (willExportHtml) {
        callback();
      }
      // 仅导出切片
      else {
        self.dialog('切片完成！<br>文件位置：' + exportPath, [
          {
            value: '打开文件位置',
            callback: function () {
              Utils.showFileInFolder(modPath.join(exportPath, 'section-1.' + fileFormat));
            },
            focus: true
          },
          {
            value: '确定'
          }
        ]);

        mass.cache.saveLock = false;
      }

      self.rockSettings.itemInMemory('lastSaveDir', exportPath);
      $('#J-hi-saveDiretory').val('');
    }

    imageToSlices(imagePath, lineXArray, lineYArray, {
      saveToDir: exportPath,
      middleBoundaryMode: isMiddleBoundaryMode,
      clipperOptions: {
        quality: imageQuality
      }
    }, function() {
      afterSliced();
    });
  },

  // 生成 HTML
  buildHTML: function (blocks, exportDirectoryPath) {
    console.log('start build html', blocks, exportDirectoryPath);

    var cache = mass.cache,
        img = cache.img,
        isBig = !!(img.width > 990 && cache.lineY === 0),
        isBig2 = !!(img.width > 990 && cache.lineY > 1);

    // 1. 加载预览模板
    Utils.loadFile('./src/preview.html', function (data) {
      var cheer = cheerio.load(data, {decodeEntities: false}),
          blockLen = blocks.length,
          bodyCon = '',
          allBlockStyles = [],
          classHeaders = '',
          localTemplateSet, temp;

      // 2. 生成 div 分块
      $.each(blocks, function (i, item) {
        var name = mass.sectionAdapter[i + 1] || (i + 1),
            cla = 'ui-' + name;

        if (isBig) {
          // 保存每个块的具体样式
          temp = {
            name: name,
            height: item.height,
            num: i + 1,
            format: cache.fileFormat
          };
        }
        else if (isBig2) {
          temp = {
            name: name,
            height: item.height,
            num: i + 1,
            format: cache.fileFormat,
            children: item.children
          };
        }
        // 宽度小于990
        else {
          temp = {
            name: name,
            width: item.width,
            height: item.height,
            num: i + 1,
            format: cache.fileFormat,
            left: item.x,
            top: item.y
          };

          // 保存所有块的头样式
          // eg: .ui-one, .ui-two, .ui-three, .ui-four{}
          if (i === blockLen - 1) {
            classHeaders += '.' + cla;
          } else {
            classHeaders += '.' + cla + ', ';
          }
        }

        // 将所有热区信息写进每一个切片单元
        if (cache.rectInBlock && cache.rectInBlock[i]) {
          if (isBig2) {
            _.each(cache.rectInBlock[i], function (curRect) {
              temp.children[curRect.belongBlockIndex].rect = temp.children[curRect.belongBlockIndex].rect || [];
              temp.children[curRect.belongBlockIndex].rect.push(curRect);
            });
          } else {
            temp.rect = cache.rectInBlock[i];
          }
        }

        // 将所有文字区信息写进每一个切片单元
        if (cache.textAreaInBlock && cache.textAreaInBlock[i]) {
          if (isBig2) {
            _.each(cache.textAreaInBlock[i], function (curRect) {
              temp.children[curRect.belongBlockIndex].textarea = temp.children[curRect.belongBlockIndex].textarea || [];
              temp.children[curRect.belongBlockIndex].textarea.push(curRect);
            });
          } else {
            temp.textarea = cache.textAreaInBlock[i];
          }
        }

        allBlockStyles.push(temp);
      });

      if (isBig) {
        localTemplateSet = mass.rockSettings.getItemInSetting('big', 'template');
        !localTemplateSet && (localTemplateSet = template.styleBig);
        bodyCon = _.template(localTemplateSet)({
          blockStyles: allBlockStyles,
          blocks: allBlockStyles,
          wrapperWidth: cache.wrapperWidth
        });
      }
      else if (isBig2) {
        localTemplateSet = mass.rockSettings.getItemInSetting('big2', 'template');
        !localTemplateSet && (localTemplateSet = template.styleBig2);
        bodyCon = _.template(localTemplateSet)({
          blockStyles: allBlockStyles,
          blocks: allBlockStyles,
          wrapperWidth: cache.wrapperWidth
        });
      }
      else {
        localTemplateSet = mass.rockSettings.getItemInSetting('small', 'template');
        !localTemplateSet && (localTemplateSet = template.style);
        bodyCon = _.template(localTemplateSet)({
          blockStyles: allBlockStyles,
          classHeaders: classHeaders,
          blocks: allBlockStyles
        });
      }

      cheer('body').append(bodyCon);

      // save to clipboard
      cache.clipboard = bodyCon;

      // 生成页面
      var saveFileName = modPath.join(exportDirectoryPath, 'index.html');
      fs.writeFile(saveFileName, cheer.html(), function (err) {
        if (err) return console.log(err);

        mass.dialog('导出切片和 HTML 成功！<br>文件位置：' + exportDirectoryPath, [
          {
            value: '浏览器中预览',
            callback: function () {
              Utils.openFileExternal(saveFileName);
              return false;
            },
            focus: true
          },
          {
            value: '打开文件位置',
            callback: function () {
              Utils.showFileInFolder(saveFileName);
              return false;
            }
          },
          {
            value: '关闭'
          }
        ]);
        alertify.success('导出成功！可点击右上角按钮复制代码', 10000);

        $('#J-copyCode').removeClass('hide');

        // 已经有过导出操作，跳过此步
        if (!cache.quickSavePath) {
          // 生成origin图片
          var originImageFileName = modPath.join(exportDirectoryPath, 'origin.' + cache.fileFormat);
          var readStream = fs.createReadStream(img.path);
          var writeStream = fs.createWriteStream(originImageFileName);

          readStream.pipe(writeStream);
          writeStream.on('close', function () {
            console.log('original file created!');
          });
        }

        // 生成config文件
        var configContent = '{\n' +
            '\t"line": ' + JSON.stringify(cache.line) + ',\n' +
            '\t"rect": ' + JSON.stringify(cache.rect) + ',\n' +
            '\t"textArea": ' + encodeURIComponent(JSON.stringify(cache.textArea)) + '\n' +
            '}';

        var configFileName = modPath.join(exportDirectoryPath, 'config.json');
        fs.createWriteStream(configFileName).write(configContent);

        // 解锁
        cache.saveLock = false;

        cache.quickSavePath = exportDirectoryPath;
      });
    });
  },

  // 初始化画布
  initCanvas: function () {
    console.log('initCanvas');
  },

  // 导出 HTML 和切片
  exportHTML: function(exportDirectoryPath) {
    var self = this;
    var blocks = this.getCutBlocks();

    alertify.log('正在导出 HTML 包...');

    mass.clipImage(exportDirectoryPath, function() {

      var exportPath = self.getExportPath(exportDirectoryPath, true);

      $('#J-hi-saveDiretoryForHtml').val('');
      mass.buildHTML(blocks, exportPath);
    });
  },

  // 软件关闭之前调用
  beforeClose: function () {
    this.Line.store();
    return true;
  },

  // 键盘输入监听
  keyboardMonitor: function () {
    var kibo = new Kibo(),
        cache = this.cache,
        $offset = $('#J-offset');
    $quality = $('#J-quality');

    kibo.down(['left', 'right', 'up', 'down'], function (e) {
      if ($offset.is(':focus') ||
          $quality.is(':focus') ||
          $('#' + cache.focusRectId).find('input').is(':focus') ||
          $('#' + cache.focusTextAreaId).find('textarea').is(':focus')) return;

      var key = e.which, direction;

      if (cache.focusLineId || cache.focusRectId || cache.focusTextAreaId) {
        e.preventDefault();
      }
      else {
        return;
      }

      if (cache.focusLineId) {
        var curLine = cache.line[cache.focusLineId],
            curPos = curLine.pos,
            permiY = curLine.type === 'Y' && (key === 37 || key === 39),
            permiX = curLine.type === 'X' && (key === 38 || key === 40);

        direction = (key === 37 || key === 39) ? 'left' : 'top';

        if (!permiY && !permiX) return;

        // 留4px的边界
        if ((key === 37 || key === 38) && curPos === 4) return;
        if ((key === 39 && curPos === cache.img.width - 4) || (key === 40 && curPos === cache.img.height - 4)) return;

        var line = document.getElementById(cache.focusLineId);

        if (key === 37 || key === 38) {
          curLine.pos--;
        } else {
          curLine.pos++;
        }
        $offset.val(curLine.pos);
        line.style[direction] = curLine.pos + 'px';

        mass.Line.store();
      } else if (cache.focusRectId) {
        var recter = document.getElementById(cache.focusRectId),
            curRect = cache.rect[cache.focusRectId];

        direction = (key === 37 || key === 39) ? (e.shiftKey ? 'width' : 'left') : (e.shiftKey ? 'height' : 'top');

        // 留4px的边界
        var case1 = key === 37 && curRect.left < 1,
            case2 = key === 39 && curRect.left > cache.img.width - curRect.width - 3,
            case3 = key === 38 && curRect.top < 1,
            case4 = key === 40 && curRect.top > cache.img.height - curRect.height - 3;

        if (case1 || case2 || case3 || case4) return;

        if (key === 37) {
          curRect[e.shiftKey ? 'width' : 'left']--;
        } else if (key === 39) {
          curRect[e.shiftKey ? 'width' : 'left']++;
        } else if (key === 38) {
          curRect[e.shiftKey ? 'height' : 'top']--;
        } else if (key === 40) {
          curRect[e.shiftKey ? 'height' : 'top']++;
        }

        if (e.shiftKey && !$('#' + cache.focusRectId).find('.setting-area').hasClass('hide')) {
          if (curRect[direction] < 10) {
            curRect[direction] = 10;
          }
          $('#' + cache.focusRectId).find('input[data-type="' + direction + '"]').val(curRect[direction]);
        }

        $offset.val(0);
        recter.style[direction] = curRect[direction] + 'px';
      } else if (cache.focusTextAreaId) {
        var textArea = document.getElementById(cache.focusTextAreaId),
            curTextArea = cache.textArea[cache.focusTextAreaId];

        direction = (key === 37 || key === 39) ? (e.shiftKey ? 'width' : 'left') : (e.shiftKey ? 'height' : 'top');

        // 留4px的边界
        var case1 = key === 37 && curTextArea.left < 1,
            case2 = key === 39 && curTextArea.left > cache.img.width - curTextArea.width - 3,
            case3 = key === 38 && curTextArea.top < 1,
            case4 = key === 40 && curTextArea.top > cache.img.height - curTextArea.height - 3;

        if (case1 || case2 || case3 || case4) return;

        if (key === 37) {
          curTextArea[e.shiftKey ? 'width' : 'left']--;
        } else if (key === 39) {
          curTextArea[e.shiftKey ? 'width' : 'left']++;
        } else if (key === 38) {
          curTextArea[e.shiftKey ? 'height' : 'top']--;
        } else if (key === 40) {
          curTextArea[e.shiftKey ? 'height' : 'top']++;
        }

        if (e.shiftKey) {
          if (curTextArea[direction] < 10) {
            curTextArea[direction] = 10;
          }
        }

        $offset.val(0);
        textArea.style[direction] = curTextArea[direction] + 'px';
      }
      ;
    });
    kibo.down('delete', function (e) {
      if (cache.img) {
        if (cache.focusLineId) {
          mass.Line.delete(cache.focusLineId);
        }
        else if (cache.focusRectId) {
          mass.Rect.delete(cache.focusRectId);
        }
        else if (cache.focusTextAreaId) {
          mass.TextArea.delete(cache.focusTextAreaId);
        }
      }
    });

    // 禁止ctrl A操作
    kibo.down('ctrl a', function (e) {
      if (!/input|textarea/i.test(e.target.tagName)) {
        return false;
      }
      $(e.target).select();
    });

    // 快捷键
    kibo.down('ctrl s', function (e) {
      if (e.shiftKey) {
        $('#J-exportPet').trigger('click');
      } else {
        $('#J-exportHTML').trigger('click');
      }
    });
    kibo.down('ctrl q', function () {
      $('#J-useful-menu > .dropdown-toggle').trigger('click');
    });
    kibo.down('ctrl n', function () {
      $('#J-selectFile').trigger('click');
    });
    kibo.down('ctrl d', function () {
      $('#J-reset').trigger('click');
    });
    kibo.down('ctrl r', function () {
      $('#J-mapArea').trigger('click');
    });
    kibo.down('ctrl t', function () {
      $('#J-textArea').trigger('click');
    });
    kibo.down('ctrl e', function () {
      $('#J-getLastLine > .dropdown-toggle').trigger('click');
    });

    // F5 解析/还原 当前自定义内容区
    kibo.down('f5', function () {
      mass.TextArea.preview();
    });
  },

  // 检查客户端
  checkClient: function () {
    var self = this;
    var platform = process.platform;

    self.clientInfo = {
      isWin: true,
      isMacOS: false,
      isLinux: false,
      // 文件分隔符
      fileSeparator: '\\'
    };

    if (platform === 'darwin') {
      self.clientInfo.isMacOS = true;
      self.clientInfo.fileSeparator = '\/';
    }
    else if (platform === 'linux') {
      self.clientInfo.isLinux = true;
      self.clientInfo.fileSeparator = '\/';
    }
    else if (platform === 'win32') {

    }
    else {
      console.log('Unexpected platform or architecture:', process.platform, process.arch)
    }

    // 检查用户设置
    var updateWay = mass.rockSettings.getItemInSetting('update');
    if (updateWay === 'tip') {
      // check new version
      Utils.checkVersion();
    }
  },

  observer: function () {
    var self = this;
    var cache = self.cache;
    var wrapper = $('#wrapper');
    var contextmenu;

    // 检查客户端
    self.checkClient();

    // Mac OS X
    if (self.clientInfo.isMacOS) {
      contextmenu = require('./js/contextmenuOSX');
    }
    // Windows || Linux
    else {
      contextmenu = require('./js/contextmenu');
    }

    var context = contextmenu.init();
    cache.menuSource = contextmenu.contextMenuSource;

    var Rect = require('./js/rect'),
        Line = require('./js/line'),
        TextArea = require('./js/textarea');

    mass.Rect = Rect;
    mass.Line = Line;
    mass.TextArea = TextArea;

    var imgCover = $('#J-image-process-cover'),
        offset = $('#J-offset'),
        addImg = $('.addImg'),
        $image = $('#J-image'),
        hideImgCalculate = $('#J-Calculate'),
        fileFormat;

    this.resizeHandler();

    // 添加图片按钮位置调整之后再显示出来
    addImg.removeClass('uninit');

    // 文件拖拽
    this.dropFile();
    // 拖拽文件到界面没有drop 再次回到界面时移除遮罩
    $('#overlay').mouseover(function (e) {
      $(this).hide();
    });

    // 标尺
    this.ruler();

    // 选择图片
    $('#J-selectFile, .addImg').click(function (e) {
      // 默认打开上次打开的目录
      var lastDirectory = mass.rockSettings.itemInMemory('lastDirectory');
      if (lastDirectory) {
        $('#J-hi-select').attr('nwworkingdir', lastDirectory).trigger('click');
      } else {
        $('#J-hi-select').removeAttr('nwworkingdir').trigger('click');
      }
    });

    // 1. 先在隐藏 image 元素中检查图片宽高度
    hideImgCalculate.load(function () {
      var current = $(this);
      var imagePath = current.attr('src');
      var imageWidth = current.width();
      var imageHeight = current.height();

      // 判断图片宽度和高度
      if (imageWidth < 50 || imageHeight < 50) {
        alertify.log('图片太小了？请选择宽高尺寸不少于 50px 的图片...');
      } else {

        fileFormat = Utils.getFileFormat(imagePath);

        cache.fileFormat = fileFormat;
        cache.img = {
          width: imageWidth,
          height: imageHeight,
          path: imagePath
        };

        $image.attr('src', imagePath);

        self.rockSettings.itemInMemory('lastDirectory', modPath.dirname(current.attr('src')));
      }

      $('#J-hi-select').val('');
    });

    // 2. 宽高没问题，载入主区域
    $image.load(function () {
      $image.hasClass('hide') && $image.removeClass('hide');
      self.imageChangeHandler();
    });

    // 上传文件
    $('#J-hi-select').change(function (e) {
      var filePath = this.value;

      if (filePath == '') return;

      fileFormat = Utils.getFileFormat(filePath);

      // 检查 path 合法性
      if (!self.reg.imgFile.test(fileFormat)) {
        self.dialog('请选择 jpg、jpeg 或 png 格式的文件', true);
        return;
      }

      console.log(filePath);

      hideImgCalculate.attr('src', filePath);
    });

    // 导出切片
    $('#J-exportPet').click(function () {
      if (!cache.img) return alertify.log('还没有选择图片，先切图吧...');
      if (!cache.lineX && !cache.lineY) return alertify.log('是不是忘了划参考线了？');

      $('#J-hi-saveDiretory').trigger('click');
    });
    $('#J-hi-saveDiretory').change(function () {
      self.clipImage(this.value);
    });

    // 导出HTML
    $('#J-exportHTML').click(function () {
      if (!cache.img) return alertify.log('还没有选择图片，先切图吧...');
      if (!cache.lineX && !cache.lineY) return alertify.log('是不是忘了划参考线了？');

      if (!mass.Rect.check()) {
        return alertify.log('热区位置错误，不能与参考线重合，已标为红色背景，请先调整才能进行下一步操作。', 'error', 8000);
      } else if (!mass.TextArea.check()) {
        return alertify.log('文字区位置错误，不能与参考线重合，已标为红色背景，请先调整才能进行下一步操作。', 'error', 8000);
      }
      ;

      if (cache.saveLock) {
        alertify.log('保存进行中，请稍作等待...');
      }
      else {
        if (cache.quickSavePath) {
          mass.exportHTML(cache.quickSavePath);
        }
        else {
          $('#J-hi-saveDiretoryForHtml').trigger('click');
        }
      }
    });

    $('#J-hi-saveDiretoryForHtml').change(function () {
      mass.exportHTML(this.value);
    });

    $('#J-hi-saveDiretoryForUserImport').change(function () {
      var localSet = window.localStorage.setting,
          that = this,
          settingPath = that.value;

      fs.readFile(settingPath, function (err, data) {
        if (err) {
          return mass.dialog('文件读取错误！<br>' + err, true);
        }

        var decodeData = Utils.str_decode(data);

        if (decodeData === 'error') {
          mass.dialog('文件解析出错！请检查文件编码类型', true);
          return;
        }

        var parseData;

        try {
          parseData = JSON.parse(decodeData);
        } catch (e) {
          mass.dialog('文件解析出错！请检查是否Json格式<br>' + e, true);
          return console.log(e);
        }

        if (localSet) {
          mass.confirmy('检测到之前已有配置，是否覆盖？', function () {
            window.localStorage.setting = decodeData;
            alertify.success('用户设置导入成功！');
          });
        }
        else {
          window.localStorage.setting = decodeData;
          alertify.success('用户设置导入成功！');
        }

        $(that).val('');
      });
    });

    $('#J-hi-saveDiretoryForUserExport').change(function () {
      var localSet = window.localStorage.setting,
          that = this,
          path = that.value;

      if (localSet) {
        var settingFileName = modPath.join(path, 'settings.json');
        fs.createWriteStream(settingFileName).write(localSet);
        mass.dialog('用户设置导出成功！<br>文件位置：' + path, [
          {
            value: '打开文件位置',
            callback: function () {
              Utils.showFileInFolder(settingFileName);
              return false;
            },
            focus: true
          },
          {
            value: '关闭'
          }
        ]);
        alertify.success('用户设置导出成功！');
        $(that).val('');
      }
    });

    var mapArea = $('#J-mapArea'),
        textArea = $('#J-textArea');
    // 画热区
    mapArea.click(function () {
      if (cache.drawText) {
        textArea.removeClass('current');
        cache.drawText = false;
      }

      if (cache.drawMap) {
        cache.drawMap = false;
        imgCover.removeClass('mapCursor');
        $(this).removeClass('current');
      } else {
        cache.drawMap = true;
        imgCover.addClass('mapCursor');
        $(this).addClass('current');
      }
    });
    this.Rect.drawMap();
    // 自定义区
    textArea.click(function () {
      if (cache.drawMap) {
        mapArea.removeClass('current');
        cache.drawMap = false;
      }

      if (cache.drawText) {
        cache.drawText = false;
        imgCover.removeClass('mapCursor');
        $(this).removeClass('current');
      } else {
        cache.drawText = true;
        imgCover.addClass('mapCursor');
        $(this).addClass('current');
      }
    });
    this.TextArea.drawText();

    // setting
    $('#J-userSettings').click(function () {
      $.artDialog({
        title: '设 置',
        lock: true,
        resize: false,
        button: [
          {
            value: '保 存',
            callback: function () {
              console.log('点击保存');
              return mass.rockSettings.saveAllSetting();
            },
            focus: true
          },
          {
            value: '取 消',
            callback: function () {
              console.log('取消保存');
            }
          }
        ],
        initialize: function () {
          mass.dialog_commonInit();
          var dialogParent = $('.d-outer').parent();

          this.content($('#J-settings').html());
          dialogParent.hide();
          $('.dialogWrap').parent().css('padding', 0);

          // 打开设置界面前先初始化用户选择
          mass.rockSettings.init();

          dialogParent.fadeIn(300);

          mass.rockSettings.listen();
        }
      });
    });

    // about
    $('#J-about').click(function () {
      mass.dialog({
        title: '关于 Puzzler',
        width: 300,
        content: _.template($('#template-about').html())({
          config: config
        })
      });
    });

    // help
    $('#J-help').click(function () {
      function _show(content) {
        mass.dialog({
          title: '使用帮助',
          width: 500,
          content: _.template($('#template-help').html())({
            config: config,
            content: content
          })
        });
      }

      // 先从缓存中读取
      if (mass.helpcontent) {
        _show(mass.helpcontent);
      } else {
        // 加载 md 文档
        Utils.loadFile('./docs/HELP.md', function (data) {
          // 解析为 markdown 格式
          Utils.parseMarkdown(data, function (htmlcontent) {
            _show(htmlcontent);
            mass.helpcontent = htmlcontent;
          });
        });
      }
    });

    // donate
    wrapper.on('click', '#J-donate', function () {
      mass.dialog({
        title: '赞助 ♨',
        width: 520,
        height: 280,
        content: _.template($('#template-donate').html())({})
      });
    });

    // check update
    wrapper.on('click', '#J-about-update', function () {
      Utils.checkVersion(true);
    });

    // 设置图片质量
    $('#J-quality').change(function () {
      var current = $(this);
      var quality = parseInt(current.val());

      if (quality) {
        // quality 介于 1 ~ 92 之间
        // 为什么是 92 ？超过 92 压缩之后出来的图片会比原图更大，100 时甚至会超过原图几倍！
        quality = quality > 92 ? 92 : quality < 1 ? 1 : quality;

        mass.cache.imageQuality = quality;
      }
    });

    // 监听偏移量变化
    offset.change(function () {
      if (!cache.focusLineId) return;
      var cacheLine = cache.line[cache.focusLineId],
          that = $(this),
          val = that.val(),
          lt;

      cacheLine.type === 'X' && (val = Math.min(val, cache.img.height - 4));
      cacheLine.type === 'Y' && (val = Math.min(val, cache.img.width - 4));

      cacheLine.pos = val;

      lt = cacheLine.type === 'X' ? 'top' : 'left';
      $('#' + cache.focusLineId).css(lt, val + 'px');
      that.val(val);

      mass.Line.store();
    });

    this.keyboardMonitor();

    // 禁止外部选取操作
    $('html').on('selectstart', function (e) {
      e.preventDefault();
    });

    // 右键
    imgCover.on('contextmenu', function (ev) {
      ev.preventDefault();
      var target = $(ev.target);
      if (target.hasClass('imgCover')) {
        context.exportMenu.popup(ev.clientX, ev.clientY);
      }
      else if (target.hasClass('rect')) {
        context.rectMenu.popup(ev.clientX, ev.clientY);
      }
      else if (target.parent().hasClass('textzone')) {
        context.textAreaMenu.popup(ev.clientX, ev.clientY);
      }
      else if (target.hasClass('lineX') || target.hasClass('lineY')) {
        context.lineMenu.popup(ev.clientX, ev.clientY);
      }
      return false;
    });

    // A
    $('body').delegate('a', 'click', function (e) {
      e.preventDefault();

      var current = $(this);
      if (!current.attr('nopen')) {
        gui.Shell.openExternal(current.attr('href'));
      }

    });

    $('.toolbar').find('.toolbar-item:not(.toolbar-dropmenu)').attr('data-placement', 'bottom').end().tooltip({
      selector: '.toolbar-item'
    });

    $('.addImg').tooltip({
      placement: 'right'
    });

    $('.dropdown-menu li a').attr('nopen', 1).click(function (e) {
      mass.dropMenu(e);
    });

    $('#J-reset').click(function () {
      if (cache.lineX || cache.lineY || cache.rectNum || cache.textAreaNum) {
        mass.confirmy('将清空参考线、热区、自定义区等操作记录，确定吗？', function () {
          mass.reset();
        });
      }
    });

    $('#J-copyCode').click(function () {
      try {
        if (cache.clipboard) {
          gui.Clipboard.get().set(cache.clipboard);
          alertify.log('复制成功。', 'success', 5000);
        }
      } catch (e) {
        alertify.log('复制异常。', 'error', 5000);
      }
    });

    $(window).resize(this.resizeHandler);

    // 窗口关闭确认
    gui.Window.get().on('close', function () {
      if (mass.beforeClose()) {
        this.close(true);
      }
    });
  },

  // 初始化方法
  init: function () {
    $(function () {
      gui.Window.get().show();
      mass.observer();
    });
  }
};

global.mass = mass;

mass.init();
