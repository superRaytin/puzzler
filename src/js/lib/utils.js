/**
 * utils
 */

var require = global.require;
var fs = require('fs');
var iconv = require('iconv-lite');

var gui = global.gui;
var mass = global.mass;

var Utils = {
    // 在本地文件窗口中展示文件
    showFileInFolder: function(filePath) {
        gui.Shell.showItemInFolder(filePath);
    },

    // 调用系统打开方式来打开文件
    openFileExternal: function(filePath) {
        gui.Shell.openItem(filePath);
    },

    // 载入文件
    loadFile: function(filePath, callback) {
        var self = this;
        var encodings = ['gbk', 'gb2312', 'ascii', 'binary', 'base64'];

        // 检查是否存在此文件
        if (fs.existsSync(filePath)) {

            fs.readFile(filePath, function(err, data) {
                if (err) return console.log(err);

                var decodeData = self.str_decode(data);

                if (decodeData === 'error') {
                    mass.dialog('文件解析出错！请检查文件编码类型', true);
                    return;
                }

                var encode = 'utf-8';

                // 编码不对试着用别的编码
                if (decodeData.indexOf('�') != -1) {
                    for (var i = 0, len = encodings.length; i < len; i++) {
                        decodeData = iconv.decode(data, encodings[i]);
                        if (decodeData.indexOf('�') == -1) {
                            encode = encodings[i];
                            console.log('文件编码： ' + encodings[i]);
                            break;
                        }
                    }
                }

                callback(decodeData, encode);
            });
        }
    },

    // 字符解码
    str_decode: function(buf, encode) {
        if (!buf) return '';

        encode = encode || 'utf-8';

        var encodings = ['gbk', 'gb2312', 'ascii', 'binary', 'base64'];
        var result = 'error';
        var tryTimes = 0;

        (function() {
            var args = arguments;

            try{
                result = iconv.decode(buf, encode);
            }
            catch(e) {
                if (encodings[tryTimes]) {
                    tryTimes++;
                    args.callee();
                }
            }
        })();

        return result;
    },

    // get file format
    getFileFormat: function(str) {
        var format = str.substr(str.lastIndexOf('.') + 1);

        return format;
    }
};

module.exports = Utils;