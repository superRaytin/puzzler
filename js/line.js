/**
 * line.
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
    delLine: function(lineId){
        var cache = mass.cache,
            curLine = $('#' + lineId);
        if(curLine.hasClass('lineX')){
            cache.lineX--;
        }else{
            cache.lineY--;
        }

        delete mass.cache.line[lineId];
        cache.focusLineId = null;

        curLine.remove();

        this.storeLine();
        //$('#J-imgCover').removeClass('lineMovingX').removeClass('lineMovingY');
    },
    focusLine: function(lineId){
        var cache = mass.cache,
            imgCover = $('#J-imgCover');

        cache.focusRectId = null;
        cache.focusLineId = lineId;
        imgCover.find('.lineX, .lineY').removeClass('line-focus');
        imgCover.find('.rect').removeClass('rect-focus');
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
    addLine: function(option){
        var cache = mass.cache,
            imgCover = $('#J-imgCover'),
            lineuuid = cache.lineuuid,
            lineId = option.lineId,
            type = option.type,
            pos = option.pos,
            styleIn;

        if(!lineId){
            lineId = 'line-' + lineuuid;
        }

        cache.line[lineId] = {
            type: type,
            pos: pos
        };
        cache.lineuuid++;

        if(type === 'X'){
            cache.lineX++;
            styleIn = 'top';
        }else{
            cache.lineY++;
            styleIn = 'left';
        }

        imgCover.append('<div class="line'+ type +'" id="'+ lineId +'" style="'+ styleIn +': '+ pos +'px"></div>');
    },
    resetLine: function(){
        // 清除旧的参考线
        $('#J-imgCover').find('.lineX, .lineY').remove();

        $.extend(true, mass.cache, {
            focusLineId: null,
            lineuuid: 1,
            lineX: 0,
            lineY: 0
        });

        mass.cache.line = {};
    },
    // 保存切线列表
    storeLine: function(){
        var cache = mass.cache;
        if(cache.lineX || cache.lineY){
            window.localStorage.line = JSON.stringify(cache.line);
        }
    },
    // 批量导入切线
    importLines: function(lineObj, callback){
        var cache = mass.cache,
            availableLineNum = 0,
            flowLineNum = 0;

        _.each(lineObj, function(line){
            var type = line.type,
                pos = line.pos;

            if(type === 'X'){
                // 上次的记录中超出了图片区域
                if(pos > cache.img.height){
                    flowLineNum++;
                    return;
                };
            }else{
                if(pos > cache.img.width){
                    flowLineNum++;
                    return;
                };
            }

            availableLineNum++;

            main.addLine({
                type: type,
                pos: pos
            });
        });

        if(callback){
            callback(availableLineNum, flowLineNum);
        }
    }
};
module.exports = main;