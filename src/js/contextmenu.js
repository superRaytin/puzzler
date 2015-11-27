/**
 * contextmenu.
 */

var window = global.window;
var console = window.console;

var gui = global.gui;

var source = {};

var Contextmenu = {
    // 初始化右键菜单
    init: function() {
        var mass = global.mass;
        var cache = mass.cache;

        function menuMachine(name, option){
            return (source[name] = new gui.MenuItem(option));
        }

        // 预览区 menu
        var previewMenu = new gui.Menu();
        previewMenu.append(menuMachine('exportPet', {
            label: '仅导出图片 (Ctrl+Shift+S)',
            click: function(){
                $('#J-exportPet').trigger('click');
            }
        }));
        previewMenu.append(menuMachine('exportHTML', {
            label: '导出HTML和图片 (Ctrl+S)',
            click: function(){
                $('#J-exportHTML').trigger('click');
            }
        }));
        var lineMenu = new gui.Menu();
        lineMenu.append(menuMachine('delLine', {
            label: '删除切线 (Del)',
            click: function(){
                mass.Line.delete(cache.focusLineId);
            }
        }));

        var rectMenu = new gui.Menu();
        rectMenu.append(menuMachine('delRect', {
            label: '删除热区 (Del)',
            click: function(){
                mass.Rect.delete(cache.focusRectId);
            }
        }));

        var textAreaMenu = new gui.Menu();
        textAreaMenu.append(menuMachine('delTextArea', {
            label: '删除此自定义区域 (Del)',
            click: function(){
                mass.TextArea.delete(cache.focusTextAreaId);
            }
        }));
        textAreaMenu.append(menuMachine('delTextArea', {
            label: '查看HTML源代码',
            click: function(){
                mass.TextArea.previewHTML();
            }
        }));

        var menu = {};
        menu.previewMenu = previewMenu;
        menu.lineMenu = lineMenu;
        menu.rectMenu = rectMenu;
        menu.textAreaMenu = textAreaMenu;

        this.contextMenuSource = source;

        return menu;
    },

    contextMenuSource: {}
};

module.exports = Contextmenu;