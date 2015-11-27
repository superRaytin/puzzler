/**
 * config.
 */

var require = global.require,
    template = require('./js/template');

module.exports = {
    "name": "MarkTool",
    "desc": "Slicing image into HTML",
    "version": "0.8.0",
    "updateURL": "https://raw.githubusercontent.com/superRaytin/MarkTool/stable/package.json",
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
        "exportOption": 'default', // 导出HTML选项
        "ruler_show": true, // 是否显示标尺
        "ruler_step": 100, // 标尺步长（100 || 50）
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