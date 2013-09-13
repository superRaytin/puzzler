/**
 * config.
 * User: raytin
 * Date: 13-7-28
 */
var require = global.require,
    template = require('./js/template');

module.exports = {
    "name": "Rock ImageMass",
    "version": "0.1.0",
    "updateURL": "http://www.jsfor.com/project/imageMass/update.json",
    "memory": {
        "lastSaveDir": "", // 最后一次保存目录路径
        "lastDirectory": "", // 最后一次操作路径
        "historyFiles": null, // 历史文件列表
        "history": null
    },
    "setting": {
        "template": {
            small: template.style,
            big: template.styleBig,
            big2: template.styleBig2
        },
        "theme": "default", // 预览区主题
        "tag_dblclickClose": false, // 双击关闭
        "tag_lock": true, // 锁定标签
        // 升级方式 tip || auto || never
        "update": "tip",
        // 默认保存方式 last || custom
        "savePath": {
            mode: 'last',
            path: ''
        }
    }
};