/**
 * utils
 */

var require = global.require;
var request = require('request');
var fs = require('fs');
var iconv = require('iconv-lite');
var config = require('./js/config');

var window = global.window;
var $ = window.$;
var _ = window._;
var gui = global.gui;

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
        var mass = global.mass;
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

    // 将内容解析成 markdown 格式
    parseMarkdown: function(content, callback) {
        window.marked(content, function(err, parsedData) {
            if (err) {
                callback('');
                return;
            }

            callback(parsedData);
        });
    },

    // 版本号比对
    compareVersion: function(v1, v2) {
        var k1 = parseInt(v1.replace(/\./g, ''));
        var k2 = parseInt(v2.replace(/\./g, ''));

        return k1 > k2;
    },

    // 解析更新日志
    parseChangeLog: function(str) {
        var logs = str.split('|');
        var arr = [];

        logs.forEach(function(value) {
            arr.push('<p>☞ '+ value +'</p>');
        });

        return arr.join('');
    },

    // 检测版本
    // @param 是否要弹出结果提示
    checkVersion: function(shouldAlert) {
        var self = this;
        var currentVersion = config.version;
        var platform = process.platform;
        var mass = global.mass;

        console.log('发起服务器请求...');
        request({
            method: 'get',
            uri: config.updateURL
        }, function(err, res, body) {
            if (err) {
                console.log('请求失败');

                if (shouldAlert) {
                    mass.dialog({
                        width: 250,
                        content: '网络异常，请检查网络后重试'
                    });
                }

                return;
            }

            // 尝试解析成 JSON
            try {
                var data = JSON.parse(body);
            } catch (e) {
                if (shouldAlert) {
                    mass.dialog({
                        width: 250,
                        content: '服务器异常，请重试'
                    });
                }

                return console.log(e);
            }

            // 服务器上的版本号
            var serverVersion = data.version;

            var download = data.download;

            // 是否允许下载
            var isAllowDownload = download.allow;

            if (!isAllowDownload) {
                if (shouldAlert) {
                    mass.dialog({
                        width: 250,
                        content: '当前服务不可用，请稍候重试或联系作者'
                    });
                }
                return;
            }

            // 当前系统信息
            var currentOsAndArch = 'osx64';

            var downloadInfo;

            // 比对版本信息
            var isLaterVersion = Utils.compareVersion(serverVersion, currentVersion);
            if (isLaterVersion) {
                console.log('检测到新版本');

                // 根据客户端环境定位下载地址
                if (platform === 'darwin') {
                    if (process.arch === 'x64') {
                        currentOsAndArch = 'osx64';
                    } else {
                        currentOsAndArch = 'osx32';
                    }
                } else if (platform === 'win32') {
                    currentOsAndArch = 'win32';
                    if (process.arch === 'x64') {
                        currentOsAndArch = 'win64';
                    }
                }

                downloadInfo = download[currentOsAndArch];

                // 下载页面
                if (downloadInfo.type === 'page' && downloadInfo.url) {
                    var changelog = data.description ? self.parseChangeLog(data.description) : '';

                    mass.dialog({
                        title: '检测到新版本',
                        width: 300,
                        content: _.template($('#template-update').html())({
                            version: serverVersion,
                            description: changelog,
                            download: downloadInfo
                        })
                    });
                }
            } else {
                console.log('没有可更新的版本');

                if (shouldAlert) {
                    mass.dialog({
                        width: 250,
                        content: '当前是最新版本'
                    });
                }
            }
        });
    },

    // get file format
    getFileFormat: function(str) {
        var format = str.substr(str.lastIndexOf('.') + 1);

        return format;
    }
};

module.exports = Utils;