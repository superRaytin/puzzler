/**
 * rect.
 * User: raytin
 * Date: 13-9-26
 */
var window = global.window,
    $ = window.$,
    mass = global.mass,
    _ = window._,
    document = window.document,
    console = window.console;

var main = {
    // 画热区
    drawMap: function(){
        var cache = mass.cache,
            imgCover = $('#J-image-process-cover'),
            imgItem = imgCover.parent(),
            newRect = $('<div class="rect"></div>'),
            _drawMove = false,
            _drawMoving = false,
            scrollTop = 0,
            scrollLeft = 0,
            imgWidth, imgHeight,
            left, top, distX, distY, rect, rectCreated;

        var _rectMove = false,
            _rectMoving = false,
            rectAddX = 0,
            rectAddY = 0,
            currentRectId, trueLeft, trueTop, currentRect;

        var _rectResize = false,
            _rectResizing = false,
            trueWidth, trueHeight;

        // 点击层或resize时，将焦点放在当前的层，同时赋值基础数据
        var focusCurrentBlock = function(e, id){
            main.focus(id);
            currentRect = cache.rect[cache.focusRectId];

            left = e.clientX - cache.minusX + imgItem.scrollLeft();
            top = e.clientY - cache.minusY + imgItem.scrollTop();
            distX = e.clientX - cache.minusX + scrollLeft;
            distY = e.clientY - cache.minusY + scrollTop;
            imgWidth = cache.img.width;
            imgHeight = cache.img.height;
            rectAddX = left - currentRect.left;
            rectAddY = top - currentRect.top;

            var $curRect = $('#' + id);
            if($curRect.hasClass('rect-error')){
                $curRect.removeClass('rect-error');
            }
        };

        imgCover.mousedown(function(e){
            // 右键不触发
            if(e.button === 2) return;

            if(cache.drawMap){
                _drawMove = true;
                left = e.clientX - cache.minusX + imgItem.scrollLeft();
                top = e.clientY - cache.minusY + imgItem.scrollTop();
                distX = left;
                distY = top;

                imgWidth = cache.img.width;
                imgHeight = cache.img.height;
            }
        });

        $(document).mousemove(function(e){
            if(_drawMove || _rectMove || _rectResize){
                scrollLeft = imgItem.scrollLeft();
                scrollTop = imgItem.scrollTop();
                distX = e.clientX - cache.minusX + scrollLeft;
                distY = e.clientY - cache.minusY + scrollTop;

                distX = Math.min(distX, imgWidth - 2);
                distY = Math.min(distY, imgHeight - 2);

                var $currentRect = $('#' + currentRectId);
            }

            if(_drawMove){
                if(!rectCreated){
                    rect = newRect.clone().attr('id', 'rect-' + cache.rectuuid);
                    imgCover.append(rect);
                    rectCreated = true;
                    main.focus('rect-' + cache.rectuuid);

                    cache.rectuuid++;
                    cache.rectNum++;
                }

                rect.css({
                    left: left,
                    top: top,
                    width: distX - left,
                    height: distY - top
                });

                _drawMoving = true;
            }
            else if(_rectMove){
                trueLeft = distX - rectAddX;
                trueTop = distY - rectAddY;
                //cacheRect = cache.rect[currentRectId];

                // 子欲拖出图片区域之外，我偏不让
                // 拖到图像区域外松手时，将left值替换成边界值
                if(trueLeft > imgWidth - currentRect.width - 2){
                    trueLeft = imgWidth - currentRect.width - 2;
                }else if(trueLeft < 0){
                    trueLeft = 0;
                };
                if(trueTop > imgHeight - currentRect.height - 2){
                    trueTop = imgHeight - currentRect.height - 2;
                }else if(trueTop < 0){
                    trueTop = 0;
                };

                $currentRect.css({
                    left: trueLeft,
                    top: trueTop
                });

                _rectMoving = true;
            }
            else if(_rectResize){
                trueWidth = distX - currentRect.left;
                trueHeight = distY - currentRect.top;

                // 子欲拖出图片区域之外，我偏不让
                if(trueWidth > imgWidth - currentRect.left - 2){
                    trueWidth = imgWidth - currentRect.left - 2;
                }else if(trueWidth < 10){
                    trueWidth = 10;
                };
                if(trueHeight > imgHeight - currentRect.top - 2){
                    trueHeight = imgHeight - currentRect.top - 2;
                }else if(trueHeight < 10){
                    trueHeight = 10;
                };

                $currentRect.css({
                    width: trueWidth,
                    height: trueHeight
                });

                // 热区设置层同步赋值
                if(!$currentRect.find('.setting-area').hasClass('hide')){
                    $currentRect.find('input[data-type="width"]').val(trueWidth);
                    $currentRect.find('input[data-type="height"]').val(trueHeight);
                }

                _rectResizing = true;
            }
        }).mouseup(function(){
                if(_drawMove){
                    if(_drawMoving){
                        if(distX < left || distY < top){
                            main.delete(cache.focusRectId);
                        }
                        else{
                            // 超出图片区域之外，将dist值替换成边界值
                            if(distX > imgWidth - 2){
                                distX = imgWidth - 2;
                            }
                            if(distY > imgHeight - 2){
                                distY = imgHeight - 2;
                            }

                            cache.rect[cache.focusRectId] = {
                                left: left,
                                top: top,
                                width: Math.max(distX - left, 10),
                                height: Math.max(distY - top, 10),
                                url: '#',
                                open: false
                            };

                            rect.css('cursor', 'move')
                                .append($('#J-template-rect-setting').clone().removeAttr('id'))
                                .append('<div class="setting"><span class="glyphicon glyphicon-cog"></span></div><div class="resize"></div>');
                        }
                    }

                    _drawMove = false;
                    _drawMoving = false;
                    rectCreated = false;
                }

                if(_rectMove){
                    if(_rectMoving){
                        cache.rect[currentRectId].left = trueLeft;
                        cache.rect[currentRectId].top = trueTop;

                        _rectMoving = false;
                    }
                    _rectMove = false;
                }

                if(_rectResize){
                    if(_rectResizing){
                        cache.rect[currentRectId].width = trueWidth;
                        cache.rect[currentRectId].height = trueHeight;

                        _rectResizing = false;
                    }
                    _rectResize = false;

                    if(cache.drawMap){
                        imgCover.removeClass('resizing');
                    }
                }
            });

        // 热区移动
        imgCover.delegate('.rect', 'mousedown', function(e){
            e.stopPropagation();
            //if(e.button === 2) return;
            currentRectId = this.id;
            focusCurrentBlock(e, currentRectId);

            _rectMove = true;
        });

        // 热区收缩
        imgCover.delegate('.resize', 'mousedown', function(e){
            e.stopPropagation();

            currentRectId = this.parentNode.id;
            focusCurrentBlock(e, currentRectId);

            if(cache.drawMap){
                imgCover.addClass('resizing');
            }

            _rectResize = true;
        });

        // 热区设置
        imgCover.delegate('.setting', 'mousedown', function(e){
            e.stopPropagation();
            var that = $(this),
                area = that.prev(),
                rectId = that.parent().attr('id'),
                rect = cache.rect[rectId];

            if(area.hasClass('hide')){
                area.removeClass('hide');
                area.find('input').each(function(){
                    var curInput = $(this),
                        type = curInput.data('type');
                    if(curInput.is(':checkbox')){
                        if(rect[type]){
                            curInput.attr('checked', true);
                        }else{
                            curInput.removeAttr('checked');
                        }
                    }else{
                        rect[type] && curInput.val(rect[type]);
                    }
                });
            }else{
                area.addClass('hide');
            }
        }).delegate('.setting-area', 'mousedown', function(e){
                e.stopPropagation();
            }).delegate('.rect-setting-column input', 'change', function(e){
                var that = $(this),
                    value = that.val(),
                    type = that.data('type'),
                    rectId = that.parents('.rect').attr('id'),
                    curRect = $('#' + rectId),
                    rect = cache.rect[rectId];

                if(type === 'open'){
                    value = that.is(':checked');
                }
                else if(type === 'width'){
                    value = parseInt(value);
                    if(value > cache.img.width - rect.left - 2){
                        value = cache.img.width - rect.left - 2;
                    }
                    curRect.width(value)
                }
                else if(type === 'height'){
                    value = parseInt(value);
                    if(value > cache.img.height - rect.top - 2){
                        value = cache.img.height - rect.top - 2;
                    }
                    curRect.height(value)
                }

                rect[type] = value;
                that.val(value);

                e.stopPropagation();
            });
    },
    reset: function(){
        // 清除旧的热区
        $('#J-image-process-cover').find('.rect').remove();

        $.extend(true, mass.cache, {
            rectuuid: 1,
            rectNum: 0,
            focusRectId: null
        });

        mass.cache.rect = {};
    },
    /*
     * option:
     * {
     *     left: Number,
     *     top: Number,
     *     width: Number,
     *     height: Number,
     *     url: String,
     *     open: Boolean
     * }
     * */
    add: function(option){
        var cache = mass.cache,
            rectuuid = cache.rectuuid,
            rectId = 'rect-' + rectuuid,
            imgCover = $('#J-image-process-cover'),
            rectEntry = $('<div class="rect"></div>'),
            settingArea = $('<div class="setting-area hide"></div>'),
            resizeZone = $('<div class="setting"><span class="glyphicon glyphicon-cog"></span></div><div class="resize"></div>'),
            currentStyles;

        currentStyles = {
            left: option.left,
            top: option.top,
            width: option.width,
            height: option.height,
            cursor: 'move'
        };

        settingArea.append($('#J-template-rect-setting').html());
        rectEntry.attr('id', rectId).css(currentStyles).append(settingArea).append(resizeZone);
        imgCover.append(rectEntry);

        cache.rectuuid++;
        cache.rectNum++;
        cache.rect[rectId] = option;
    },
    focus: function(rectId){
        var cache = mass.cache,
            imgCover = $('#J-image-process-cover');

        cache.focusRectId = rectId;
        cache.focusLineId = null;
        cache.focusTextAreaId = null;
        imgCover.find('.lineX, .lineY').removeClass('line-focus');
        imgCover.find('.textzone').removeClass('textzone-focus');
        imgCover.find('.rect').removeClass('rect-focus');
        $('#' + rectId).addClass('rect-focus');
    },
    delete: function(rectId){
        var cache = mass.cache,
            curRect = $('#' + rectId);

        cache.rectNum--;

        delete mass.cache.rect[rectId];
        cache.focusRectId = null;

        curRect.remove();
    },
    // 批量导入热区
    import: function(rectObj, callback){
        _.each(rectObj, function(rect){
            main.add(rect);
        });

        if(callback){
            callback();
        }
    },
    // 检查热区位置
    check: function(){
        var cache = mass.cache,
            lines = cache.line,
            rects = cache.rect,
            isBig2 = !!(cache.img.width > 990 && cache.lineY > 1),
            critical = {
                X:{},
                Y:{}
            },
            rectInBlock = {},
            blocks,
            res = true;

        if(!cache.rectNum) return res;

        $('.rect').removeClass('rect-error');

        $.each(rects, function(rectId, rect){
            critical.Y.x = rect.left;
            critical.Y.y = rect.left + rect.width;
            critical.X.x = rect.top;
            critical.X.y = rect.top + rect.height;
            $.each(lines, function(lineId, line){
                var type = line.type,
                    pos = line.pos;

                if(pos > critical[type].x && pos < critical[type].y){
                    res = false;
                    console.log(rectId, type, critical);
                    console.log(lineId, pos);
                    console.log('--------');
                    $('#' + rectId).addClass('rect-error');
                }
            });
        });

        if(res){
            if(isBig2){
                blocks = mass.getCutBlocks('children');

                $.each(blocks, function(i, block){
                    var blockParentIndex = block.parentBlockIndex;
                    $.each(rects, function(rectId, rect){
                        var topAndSelfHeight = block.y + block.height,
                            leftAndSelfWidth = block.x + block.width;

                        if(block.width > rect.width && block.x < rect.left && block.y < rect.top && (topAndSelfHeight > rect.top + rect.height) && (leftAndSelfWidth > rect.left + rect.width)){
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
            else{
                blocks = mass.getCutBlocks();

                $.each(blocks, function(i, block){
                    $.each(rects, function(rectId, rect){
                        var topAndSelfHeight = block.y + block.height,
                            leftAndSelfWidth = block.x + block.width;

                        if(block.width > rect.width && block.x < rect.left && block.y < rect.top && (topAndSelfHeight > rect.top + rect.height) && (leftAndSelfWidth > rect.left + rect.width)){
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
        cache.rectInBlock = rectInBlock;

        return res;
        //return false;
    }
};
module.exports = main;