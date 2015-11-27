/**
 * utils
 */

var require = global.require;
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

    // get file format
    getFileFormat: function(str) {
        var format = str.substr(str.lastIndexOf('.') + 1);

        return format;
    }
};

module.exports = Utils;