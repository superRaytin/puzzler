/**
 * custom.
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
    // 画文字区
    drawText: function(){
        var cache = mass.cache,
            imgCover = $('#J-imgCover'),
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
            trueWidth, trueHeight, currentRectLeft, currentRectTop;

        imgCover.mousedown(function(e){
            // 右键不触发
            if(e.button === 2) return;

            if(imgCover.find('textarea').is(':focus')) return;

            if(cache.drawText){
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
            else if(_rectMove){
                trueLeft = distX - rectAddX;
                trueTop = distY - rectAddY;

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
                console.log(99999)
                trueWidth = distX - currentRectLeft;
                trueHeight = distY - currentRectTop;

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
                /*if(!$currentRect.find('.setting-area').hasClass('hide')){
                    $currentRect.find('input[data-type="width"]').val(trueWidth);
                    $currentRect.find('input[data-type="height"]').val(trueHeight);
                }*/

                _rectResizing = true;
            }
        }).mouseup(function(){
                if(_drawMove){
                    if(_drawMoving){
                        if(distX < left || distY < top){
                            main.delRect(cache.focusTextAreaId);
                        }
                        else{
                            // 超出图片区域之外，将dist值替换成边界值
                            if(distX > imgWidth - 2){
                                distX = imgWidth - 2;
                            }
                            if(distY > imgHeight - 2){
                                distY = imgHeight - 2;
                            }

                            cache.textArea[cache.focusTextAreaId] = {
                                left: left,
                                top: top,
                                width: Math.max(distX - left, 10),
                                height: Math.max(distY - top, 10),
                                content: '#'
                            };

                            textarea.css('cursor', 'move')
                                .append('<textarea></textarea><div class="setting_textarea"><span class="glyphicon glyphicon-eye-open"></span></div><div class="resize_textarea"></div><div class="cover"></div>');
                        }
                    }

                    _drawMove = false;
                    _drawMoving = false;
                    rectCreated = false;
                }

                if(_rectMove){
                    if(_rectMoving){
                        cache.textArea[currentRectId].left = trueLeft;
                        cache.textArea[currentRectId].top = trueTop;

                        _rectMoving = false;
                    }
                    _rectMove = false;
                }

                if(_rectResize){
                    if(_rectResizing){
                        cache.textArea[currentRectId].width = trueWidth;
                        cache.textArea[currentRectId].height = trueHeight;

                        _rectResizing = false;
                    }
                    _rectResize = false;

                    if(cache.drawText){
                        imgCover.removeClass('resizing');
                    }
                }
            });

        // 文字区移动
        imgCover.delegate('.cover', 'mousedown', function(e){
            e.stopPropagation();
            //if(e.button === 2) return;
            currentRectId = this.parentNode.id;
            main.focus(currentRectId);
            currentRect = cache.textArea[cache.focusTextAreaId];

            _rectMove = true;
            left = e.clientX - cache.minusX + imgItem.scrollLeft();
            top = e.clientY - cache.minusY + imgItem.scrollTop();
            distX = e.clientX - cache.minusX + scrollLeft;
            distY = e.clientY - cache.minusY + scrollTop;
            imgWidth = cache.img.width;
            imgHeight = cache.img.height;

            rectAddX = left - currentRect.left;
            rectAddY = top - currentRect.top;

            var $curRect = $('#' + currentRectId);
            if($curRect.hasClass('textzone-error')){
                $curRect.removeClass('textzone-error');
            }
        });

        // 编辑
        imgCover.delegate('.cover', 'dblclick', function(e){
            e.stopPropagation();
            $(this).addClass('hide').siblings('textarea').focus();
        });

        // 失去焦点加上遮罩
        imgCover.delegate('textarea', 'blur', function(e){
            e.stopPropagation();
            $(this).siblings('.cover').removeClass('hide');
        }).delegate('textarea', 'change', function(e){
                var that = $(this);
                cache.textArea[that.parent().attr('id')].content = that.val();
            });

        // 文字区收缩
        imgCover.delegate('.resize_textarea', 'mousedown', function(e){
            e.stopPropagation();
            _rectResize = true;
            currentRectId = this.parentNode.id;
            main.focus(currentRectId);
            currentRect = cache.textArea[cache.focusTextAreaId];

            left = e.clientX - cache.minusX + imgItem.scrollLeft();
            top = e.clientY - cache.minusY + imgItem.scrollTop();
            distX = e.clientX - cache.minusX + scrollLeft;
            distY = e.clientY - cache.minusY + scrollTop;
            imgWidth = cache.img.width;
            imgHeight = cache.img.height;
            rectAddX = left - currentRect.left;
            rectAddY = top - currentRect.top;

            currentRectLeft = currentRect.left;
            currentRectTop = currentRect.top;

            if(cache.drawText){
                imgCover.addClass('resizing');
            }

            var $curRect = $('#' + currentRectId);
            if($curRect.hasClass('textzone-error')){
                $curRect.removeClass('textzone-error');
            }
        });

        // 文字区设置
        imgCover.delegate('.setting_textarea', 'mousedown', function(e){
            e.stopPropagation();
            console.log('setting textzone')
        });
    },
    focus: function(textAreaId){
        var cache = mass.cache,
            imgCover = $('#J-imgCover');

        cache.focusTextAreaId = textAreaId;
        cache.focusLineId = null;
        cache.focusRectId = null;
        imgCover.find('.lineX, .lineY').removeClass('line-focus');
        imgCover.find('.rect').removeClass('rect-focus');
        imgCover.find('.textzone').removeClass('textzone-focus');
        $('#' + textAreaId).addClass('textzone-focus');
    },
    reset: function(){
        $('#J-imgCover').find('.textzone').remove();

        $.extend(true, mass.cache, {
            textAreauuid: 1,
            textAreaNum: 0,
            focusTextAreaId: null
        });

        mass.cache.textArea = {};
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
    add: function(option){
        var cache = mass.cache,
            textAreauuid = cache.textAreauuid,
            rectId = 'textarea-' + textAreauuid,
            imgCover = $('#J-imgCover'),
            rectEntry = $('<div class="textzone"></div>'),
            contentArea = $('<textarea></textarea>'),
            resizeZone = $('<div class="setting_textarea"><span class="glyphicon glyphicon-eye-open"></span></div><div class="resize_textarea"></div><div class="cover"></div>'),
            currentStyles;

        currentStyles = {
            left: option.left,
            top: option.top,
            width: option.width,
            height: option.height,
            cursor: 'move'
        };

        contentArea.val(option.content);
        rectEntry.attr('id', rectId).css(currentStyles).append(contentArea).append(resizeZone);
        imgCover.append(rectEntry);

        cache.textAreauuid++;
        cache.textAreaNum++;
        cache.textArea[rectId] = option;
    },
    delete: function(textAreaId){
        var cache = mass.cache,
            curTextArea = $('#' + textAreaId);

        cache.textAreaNum--;

        delete mass.cache.textArea[textAreaId];
        cache.focusTextAreaId = null;

        curTextArea.remove();
    },
    // 批量导入
    import: function(options, callback){
        _.each(options, function(item){
            main.add(item);
        });

        if(callback){
            callback();
        }
    },
    // 检查文字区位置
    check: function(){
        var cache = mass.cache,
            lines = cache.line,
            rects = cache.textArea,
            isBig2 = !!(cache.img.width > 990 && cache.lineY > 1),
            critical = {
                X:{},
                Y:{}
            },
            rectInBlock = {},
            blocks,
            res = true;

        if(!cache.textAreaNum) return res;

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