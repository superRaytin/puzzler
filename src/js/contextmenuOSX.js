/**
 * contextmenu for os x
 */

var window = global.window;
var console = window.console;

var gui = global.gui;

var Contextmenu = {
    init: function(){
        var mass = global.mass;
        var cache = mass.cache;

        var menu = new gui.Menu({type: 'menubar'});

        menu.createMacBuiltin("MarkTool", {
            hideWindow: false
        });

        // 预览区 menu
        var exportMenu = new gui.Menu();
        exportMenu.append(new gui.MenuItem({
            label: '仅导出图片 (Ctrl+Shift+S)',
            click: function(){
                $('#J-exportPet').trigger('click');
            }
        }));
        exportMenu.append(new gui.MenuItem({
            label: '导出HTML和图片 (Ctrl+S)',
            click: function(){
                $('#J-exportHTML').trigger('click');
            }
        }));


        var lineMenu = new gui.Menu();
        lineMenu.append(new gui.MenuItem({
            label: '删除参考线 (Del)',
            click: function(){
                mass.Line.delete(cache.focusLineId);
            }
        }));


        var rectMenu = new gui.Menu();
        rectMenu.append(new gui.MenuItem({
            label: '删除热区 (Del)',
            click: function(){
                mass.Rect.delete(cache.focusRectId);
            }
        }));


        var textAreaMenu = new gui.Menu();
        textAreaMenu.append(new gui.MenuItem({
            label: '删除此自定义区域 (Del)',
            click: function(){
                mass.TextArea.delete(cache.focusTextAreaId);
            }
        }));
        textAreaMenu.append(new gui.MenuItem({
            label: '查看HTML源代码',
            click: function(){
                mass.TextArea.previewHTML();
            }
        }));


        var manyMenus = {};
        manyMenus.exportMenu = exportMenu;
        manyMenus.lineMenu = lineMenu;
        manyMenus.rectMenu = rectMenu;
        manyMenus.textAreaMenu = textAreaMenu;

        gui.Window.get().menu = menu;

        return manyMenus;
    },

    contextMenuSource: {}
};

module.exports = Contextmenu;