 


> 在 [https://xirishi0.github.io/maze-extension/](https://xirishi0.github.io/maze-extension/) 打开此页面

## 用作扩展

此仓库可以作为 **插件** 添加到 MakeCode 中。

* 打开 [https://arcade.makecode.com/](https://arcade.makecode.com/)
* 点击 **新项目**
* 点击齿轮图标菜单下的 **扩展**
* 搜索 **https://github.com/xirishi0/maze-extension** 或 **github:xirishi0/maze-extension** 并导入

## 编辑此项目 ![构建状态标志](https://github.com/xirishi0/maze-extension/workflows/MakeCode/badge.svg)

在 MakeCode 中编辑此仓库。

* 打开 [https://arcade.makecode.com/](https://arcade.makecode.com/)
* 点击 **导入**，然后点击 **导入 URL**
* 粘贴 **https://github.com/xirishi0/maze-extension** 并点击导入

## 积木块预览

此图像显示主分支中最后一次提交的块代码。
此图像可能需要几分钟才能刷新。

![块的渲染视图](https://github.com/xirishi0/maze-extension/raw/master/.github/makecode/blocks.png)

#### 元数据（用于搜索、渲染）

* for PXT/arcade
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>


## 代码模块
* 基础模块：
    language-ext.ts 其中的promise和setTimeout并未作为block提供使用
    img-anim-ext.ts 
    sprite-ext.ts
* 角色模块：依赖status-bar
    characrer-ext.ts
* 弹射物模块：依赖角色模块和基础模块
    projectiectile-ext.ts
    （当前玩家和怪物这两个变量定义在了弹射物模块。。）
* 武器模块：依赖基础模块和整合模块
    weapon-ext.ts
* 玩家模块：依赖角色模块、武器模块、弹射物模块(弹射物瞄准玩家)和整合模块
    player-ext.ts
* 敌人模块：依赖角色模块、武器模块(击杀掉落武器)、弹射物模块(弹射物瞄准敌人)和整合模块
    enemy-ext.ts
* 迷宫模块：依赖整合模块
    mazeMonsters-ext.ts 对敌人模块的补充，依赖弹射物模块、arcade-tilemap-a-star
    mazeRoom-ext.ts 依赖武器模块、弹射物模块
* 整合模块：
    game-integrate.ts 玩家、敌人、武器和迷宫会导出到这里。依赖基础模块和迷宫模块
    game-onoverlap-ext.ts 依赖弹射物、武器、玩家、敌人、迷宫模块
curEnemyRoom迷宫怪物 和 curPlayer当前玩家 两个变量需要从projectiectile-ext.ts中分离出来；
class maze迷宫也需要从mazeRoom-ext.ts中分离出来。

## 项目模板：
    直接导入项目https://makecode.com/_AsCXpxc1hfTU；
    不用模板、只导入插件则在项目里添加拓展github:xirishi0/maze-extension；
    block里只能看见玩家、初始武器、武器弹射物和迷宫的定义；
    其余武器定义在weapon.ts，敌人定义在enemy.ts，迷宫的怪物组成定义在maze.ts；
    玩家的血量、武器伤害都较低，需要自行调整到合理的数值；
    武器伤害的调整有两种方式：直接修改弹射物的伤害，或者设置弹射物和敌方精灵重叠时修改血量；
    bug:迷宫的定义如果不放在main.ts里就会报错，向setMaze函数传入的tilemap会显示为null。。

## 打包整合：
    用一个函数function myFunc(){}将main.ts包起来，分享/上传github成为插件；
    在主项目中导入该插件，调用myFunc()；
    通过game-integrate.ts的defExtSprite就能使用该dlc里定义的玩家、敌人和武器；
    通过game-integrate.ts的mazeList就能使用该dlc里定义的迷宫；
    bug: 
      插件使用图块时可能会因为自动生成的tilemap.g.ts里有个变量transparency16导致导入时发生重定义，
      可以在导出时修改pxt.json，
      将tilemap.g.ts和tilemap.g.jres放在"testFiles":[]里，并添加"public": true。

## 已知bug & 待完善功能：
* 迷宫模块和整合模块相互依赖，需要将class maze迷宫从mazeRoom-ext.ts中分离出来；
* 武器和弹射物的击退效果有时会导致精灵瞬移，需要修改击退函数game-onoverlap-ext.ts -> reverseMove；
* AI下一行动的执行依赖于mazeMonsters-ext.ts动作里的移动(reach)/攻击(stopAtk)/跳转(jmp)，
  如果没有执行这三个动作AI就会停止行动；
* 图像旋转算法img-anim-ext.ts->transformImage有时会导致图像失真；
* 弹射物没有aoe功能，短时间内只会和一个敌人重叠产生碰撞效果，
  需要修改projectile.ts->perish和game-onoverlap-ext.ts->bulletANDsprite；
* 武器是aoe持续伤害，所以武器的damage不能调过大；
* 角色的实际血量(statusbar.value)统一为100，根据调整角色属性·HP时修改角色防御def实现血量的调整；
* 激光武器无法使用projectile.ts->aimedshot自机狙功能，不会被墙体阻挡；
* 弹幕过多、执行跟随动作mazeMonsters-ext.ts->followSprite的AI过多时可能造成卡顿；
* 打包后得到的人物、敌人、武器和迷宫还未提供选择和直接使用的接口；
* language-ext.ts的promise和setTiemout还未作为block提供使用；
* sprite-ext->isDestroyed判断精灵是否已销毁的函数未作为block提供使用；
* 有时精灵销毁后它的对话框不会消失；
* 迷宫地块未做功能拓展，陷阱等特殊地形的制作需要使用arcade原有的接口；
* 现在导入该拓展会同时导入玩家、敌人、武器、迷宫等模块，需要只导入特定模块需要将本插件切割；
* dlc的导出导入自动化；
* 待补充……