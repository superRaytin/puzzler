![MarkTool](src/img/mass.png)

MarkTool
==============

![MarkTool](docs/screenshot.png)

## Features

- 导入
	* 支持 jpg, jpeg, png 等图片类型
    * 支持拖拽导入
- 标尺
- 参考线
	* 支持拖拽
    * 支持上下左右按键微调
    * 支持单条删除和批量清空
- 导出
	* 支持导出图像切片和 HTML
    * 导出成功后支持一键浏览器预览，一键复制源代码
    * 支持自定义导出模板
    * 支持导出图像质量设置
- 用户足迹
	* 记住最后一次的保存路径和选择路径
    * 记住用户最后一次设置的切线列表
- 画热区
    * 支持上下左右按键微调坐标，配合 Shift 键还可微调宽高
    * 支持热区，并可设置链接、是否新窗口打开、标题等内容
- 自定义内容区
    * 支持 markdown 格式内容解析
- 用户设置
	* 支持模板编辑
    * 支持保存路径设置
    * 支持标尺设置

## Future
- 生成图片展示形式可选，背景或者 img 标签
- 新建自定义模板
- 历史记录（撤销、重做）
- 简单的图片处理
- 多标签？
- 图片合成？
- 自动更新

## Downloads

Latest: **v0.5.0** [changeLog](#changelog)

* Windows: [云盘下载](http://pan.baidu.com/s/1sjCxweh)
* Mac OS X: [云盘下载](http://pan.baidu.com/s/1eQcRXlS)
* Linux32: [云盘下载](http://pan.baidu.com/s/1eQgVIRS)
* Linux64: [云盘下载](http://pan.baidu.com/s/1qWHPgKG)

## 安装步骤

### windows
首先你必须安装图片处理库`GraphicsMagick`，下载地址 ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/ 注意它有 32 位和 64 位的版本，请选择与系统对应的版本下载。

安装完成打开 CMD 命令，运行：

```
gm version
```

`大多数情况` 会正确执行并返回，如果没有正确执行，可以尝试 `重启电脑`，再次运行以上命令

命令执行成功后，运行 MarkTool.exe

## 感谢以下项目
- Node-Webkit：[https://github.com/rogerwang/node-webkit/](https://github.com/rogerwang/node-webkit/)
- GraphicsMagick for node: [http://aheckmann.github.com/gm/](http://aheckmann.github.com/gm/)

## ChangeLog

### 0.5.0 (2014.11.29)
- 全新的软件界面
- 优化客户机系统侦测方法

### 0.3.1 (2013.11.15)
- 【增加】导出图片质量设置（压缩范围0~100，只支持JPG/JPEG格式图片，因为PNG压缩一直是无损的）；
- 【增加】标尺刻度值，标尺设置项；

### 0.3.0 (2013.10.11)
- 增加自定义内容区功能；
- 导出HTML的情况，同时导出配置文件和初始图片文件；
- 切线记录更改为实时保存，去掉【立即保存当前记录】功能；
- 增加常用功能菜单 —— 点击菜单栏第一项MarkTool的logo即可显示；
- 增加【导出选项】设置；
- 重构【拉取最后的切线记录】功能，解决切线ID撞车的可能；
- 增加快捷键支持；
- 增加不影响操作的右下角提示功能；
- 突出显示热区信息设置；

### 0.1.3 (2013.09.16)
- 模板增加【宽度 > 990(挖空)】一项，可导出背景图；

# License
本项目基于 MIT 协议发布

MIT: [http://rem.mit-license.org](http://rem.mit-license.org/) 详见 [LICENSE](/LICENSE) 文件
