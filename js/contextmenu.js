/**
 * contextmenu.
 * User: raytin
 * Date: 13-7-25
 */
var window = global.window,
    console = window.console;

var source = {};

// 初始化右键菜单
var contextMenuInit = function(){
    var mass = global.mass,
        cache = mass.cache,
        gui = cache.gui;

    function menuMachine(name, option){
        return (source[name] = new gui.MenuItem(option));
    }

    // 预览区 menu
    var previewMenu = new gui.Menu();
    previewMenu.append(menuMachine('exportPet', {
        label: '导出 (仅图片)',
        click: function(){
            $('#J-exportPet').trigger('click');
        }
    }));
    previewMenu.append(menuMachine('exportHTML', {
        label: '导出 (图片和HTML)',
        click: function(){
            $('#J-exportHTML').trigger('click');
        }
    }));
    var lineMenu = new gui.Menu();
    lineMenu.append(menuMachine('delLine', {
        label: '删除切线',
        click: function(){
            mass.delLine(cache.focusLineId);
        }
    }));

    var rectMenu = new gui.Menu();
    rectMenu.append(menuMachine('delRect', {
        label: '删除热区',
        click: function(){
            mass.delRect(cache.focusRectId);
        }
    }));

    var menu = {};
    menu.previewMenu = previewMenu;
    menu.lineMenu = lineMenu;
    menu.rectMenu = rectMenu;

    exports.contextMenuSource = source;

    return menu;
};

exports.init = contextMenuInit;