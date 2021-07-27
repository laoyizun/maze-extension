//%icon="\uf152" color="#BCB0E0"
namespace 迷宫{}
namespace SpriteKind{
    export const Portal = SpriteKind.create()
}
namespace Maze{
    //------------- 迷宫 -------------
    export class maze{
        map: tiles.TileMapData = null //地图
        monsters: ({ms: Enemy.monsters, createM: (e: Sprite)=>void})[][] = [] //迷宫怪物
        i: number //第i波怪物
        j: number //第j个怪物小队
        clock: number[] = [] //源源不断的怪物时钟
        weapons: ({id: number, f: ()=>void})[] = [] //装备. id:第几轮怪物出现时掉落
        k: number //装备idx
        creatMaze: ()=>void //第一次放置迷宫时初始化
        bornPlace: ()=>void //初始位置
        name:string //迷宫名称
        author :string //作者
        description :string //描述
        constructor(name:string, tilemap: tiles.TileMapData, f: ()=>void){
            this.name = name
            this.map = tilemap
            this.monsters = []
            this.i = this.j = this.k = 0
            this.weapons = []
            this.clock = []
            this.creatMaze = f
            this.bornPlace = ()=>{}
        }
    }

    export let curMaze: maze = null
    let mazes: maze[] = []

    //%block
    //%blockNamespace=迷宫
    //%group="自定义迷宫"
    //%blockId=setMaze block="自定义迷宫房间%tilemap 命名为%name"
    //% tilemap.fieldEditor="tilemap"
    //% tilemap.fieldOptions.decompileArgumentAsString="true"
    //% tilemap.fieldOptions.filter="tile"
    //% tilemap.fieldOptions.taggedTemplate="tilemap"
    //%weight=99
    //%inlineInputMode=inline
    export function setMaze(tilemap: tiles.TileMapData, name: string, f: ()=>void){
        curMaze = new maze(name, tilemap, f)
        mazes.push(curMaze)
        if(IntegrateGame.mazeList[name] != undefined){
            console.log("定义迷宫房间时发生命名冲突："+name)
            return
        }
        IntegrateGame.mazeList[name] = curMaze
        //f()
    }

    //%block
    //%blockNamespace=迷宫
    //%group="自定义迷宫"
    //%blockId=setMaze block="设置作者 %author 介绍 %description"
    export function setMazeInfo(author:string, description:string) {
        curMaze.author = author
        curMaze.description = description
    }

    //进入新房间
    let floor = 0

    let seenMazes:string[] = []


    //%block
    //%blockNamespace=迷宫
    //%group="生成迷宫"
    //%blockId=newRandomMaze block="随机放置迷宫房间"
    //%weight=99
    export function newRandomMaze(blank: string=null){
        newMaze(mazes[randint(0, mazes.length - 1)])
        let currentMazeName = Maze.curMaze.name
        if (seenMazes.indexOf(currentMazeName) == -1) {
            game.showLongText(currentMazeName + "\n by " + Maze.curMaze.author + "\n\n" + Maze.curMaze.description, DialogLayout.Full)
            seenMazes.push(currentMazeName)
        }
    }

    //%block
    //%blockNamespace=迷宫
    //%group="生成迷宫"
    //%blockId=newNextMaze block="放置迷宫房间%name"
    //%weight=99
    export function newNextMaze(name: string){
        if(IntegrateGame.mazeList[name] == undefined){
            console.log("迷宫 '"+name+"' 未定义!")
            return
        }
        newMaze(IntegrateGame.mazeList[name])
    }

    function newMaze(nextMaze: maze){
        clearMaze()
        curMaze = nextMaze
        curMaze.i = curMaze.k = 0
        if(curMaze.creatMaze != null){
            curMaze.creatMaze()
            curMaze.i = curMaze.k = 0
            curMaze.creatMaze = null
        }
        tiles.setTilemap(curMaze.map)
        info.setScore(++floor)
        curMaze.bornPlace()
        createMonsters()
    }
    //清除特定类型的精灵
    export function clearSprite(kind: number){
        let spriteKind = sprites.allOfKind(kind)
        for(let sprite of spriteKind){
            sprite.destroy()
        }
    }

    //把持续出现的怪物小队清除掉
    export function stopCreateMonster(){
        if(curMaze != null){
            while(curMaze.clock.length > 0){
                let c = curMaze.clock.removeAt(0)
                clearInterval(c)
            }
        }
    }

    //切地图时清除武器/怪物/弹射物
    export function clearMaze(){
        stopCreateMonster()
        clearSprite(SpriteKind.EnemyBullet)
        clearSprite(SpriteKind.PlayerBullet)
        clearSprite(SpriteKind.weapon)
        clearSprite(SpriteKind.Enemy)
        Bullet.curEnemyRoom = {}
    }

    //------------- 地图参数 -------------
    //%block
    //%group="参数"
    //%blockNamespace=迷宫
    //%blockId=outofMap block="图块列%c 行%r 不在地图范围内"
    //%weight=81
    export function outofMap(c: number, r: number){
        return Maze.curMaze.map.isOutsideMap(c, r)
    }
    //%block
    //%group="参数"
    //%blockNamespace=迷宫
    //%blockId=isWall block="图块列%c 行%r 是墙"
    //%weight=80
    export function isWall(c: number, r: number){
        return Maze.curMaze.map.isWall(c, r)
    }
    //%block
    //%group="参数"
    //%blockNamespace=迷宫
    //%blockId=mapWidth block="地图宽"
    //%weight=80
    export function mapWidth(){
        return Maze.curMaze.map.width
    }
    //%block
    //%group="参数"
    //%blockNamespace=迷宫
    //%blockId=mapHeight block="地图高"
    //%weight=79
    export function mapHeight(){
        return Maze.curMaze.map.height
    }

    //------------- 坐标转行列 -------------
    export function toCR(x_y: number){
        return x_y>>curMaze.map.scale
    }

    //------------- 迷宫怪物 -------------
    // 敌人*n => 怪物小队 *m => 一波怪物 *x =>迷宫怪物

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=setMazeMonsters block="创建一波怪物"
    //%weight=80
    //% handlerStatement=true
    //% topblock=false
    export function setMazeMonsters(f: ()=>void){
        curMaze.i++
        curMaze.monsters.push([])
        f()
    }

    //正在设置的一波怪物
    function curMonsters(){
        return curMaze.monsters[curMaze.monsters.length-1]
    }

    //根据命名标记获取怪物小队
    function getMonsters(name: string){
        return Enemy.monstersList[name]
    }

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=createrMazeMonsters block="怪物组成%name (怪物小队) 在图块列表 列$x 行$y"
    //%weight=79
    export function setMonstersMembers(name: string, x: number, y: number){
        let m = getMonsters(name)
        if(m == undefined){
            console.log("怪物小队 '"+name+"' 未定义!")
            return
        }
        curMonsters().push({ms: m, createM: (e: Sprite)=>{
            tiles.placeOnTile(e, tiles.getTileLocation(x, y))
        }})
    }

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=createrMazeMonsters2 block="怪物组成%name (怪物小队) 在随机位置的$tile 图块上"
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true
    //%weight=79
    export function setMonstersMembers2(name: string, tile: Image){
        let m = getMonsters(name)
        if(m == undefined){
            console.log("怪物小队 '"+name+"' 未定义!")
            return
        }
        curMonsters().push({ms: m, createM: (e: Sprite)=>{
            tiles.placeOnRandomTile(e, tile)
        }})
    }

    export function createMonsters(){
        while(curMaze.k < curMaze.weapons.length && curMaze.weapons[curMaze.k].id <= curMaze.i){
            curMaze.weapons[curMaze.k++].f()
        }
        if(curMaze.i < curMaze.monsters.length){
            let ms = curMaze.monsters[curMaze.i++] //下一波怪物
            let flag = false //可能因为出现概率不满导致本轮没有怪物出现。。
            let t = 0
            curMaze.j = 0
            while(curMaze.j < ms.length){ //一波怪物里的所有怪物小队
                let m = ms[curMaze.j++]
                t = Math.max(t, m.ms.interval)
                setTimeout(()=>{
                    let f = ()=>{
                        let _f = ()=>{
                            for(let x of m.ms.members){ //怪物小队的所有成员
                                for(let i = 0; i < x.n; ++i){
                                    let e = Enemy.createEnemy(x.e, m.ms.unimportant, m.ms.boss, m.ms.reinforcements)
                                    m.createM(e)
                                    m.ms.act(e, m.ms.action)
                                }
                            }
                        }
                        if(Math.percentChance(m.ms.occurrence)){
                            _f()
                            flag = !m.ms.reinforcements
                        }
                    }
                    if(m.ms.continuous){
                        let c = setInterval(f, m.ms.interval)
                        curMaze.clock.push(c)
                    }
                    else{
                        f()
                    }
                }, m.ms.interval)
            }
            setTimeout(function() {
                if(!flag){
                    createMonsters()
                }
            }, t+1)
        }
        else{
            Enemy.curBossNums = Enemy.curEnemyNums = 0
            funcNextPortal()
        }
    }

    //------------- 迷宫装备 -------------

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=makeWeapon block="放置武器%name 在图块列表 列$x 行$y"
    //%weight=78
    export function makeWeapon(name: string, x: number = 0, y: number = 0){
        curMaze.weapons.push({id: curMaze.i, f: ()=>{
            let w = Weapon.makeWeapon(name, 0, 0)
            tiles.placeOnTile(w, tiles.getTileLocation(x, y))
        }})
    }

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=makeWeapon2 block="放置武器%name 在随机位置的$tile 图块上"
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true
    //%weight=77
    export function makeWeapon2(name: string, tile: Image){
        curMaze.weapons.push({id: curMaze.i, f: ()=>{
            let w = Weapon.makeWeapon(name, 0, 0)
            tiles.placeOnRandomTile(w, tile)
        }})
    }

    //------------- 传送门 -------------
    Helper.setAnimation([img`
        . . . . . . . . 6 . . . . . . .
        . . . . . 9 9 6 9 6 9 . . . . .
        . . . . 9 9 d 9 d 9 9 9 . . . .
        . . . . 9 d 1 1 1 d d 9 9 . . .
        . . . . 6 9 d 1 1 1 1 d 9 . . .
        . . . 6 6 9 d 1 1 1 d 9 6 . . .
        . . 9 9 9 d 1 1 1 1 d 9 6 6 . .
        . . 9 d d 1 1 1 1 1 1 d 9 9 . .
        . . 9 d 1 1 1 1 1 1 1 1 d 9 . .
        . . 6 9 d 1 1 1 1 1 1 d 9 9 . .
        . . 6 6 9 d 1 1 1 1 d 9 6 6 . .
        . . . 9 9 d d d 1 1 d 9 6 . . .
        . . . 9 9 d 9 9 d 1 d 9 . . . .
        . . . . 9 9 6 6 9 d 9 9 . . . .
        . . . . . . . 6 6 9 9 . . . . .
        . . . . . . . . . . . . . . . .
    `,img`
    . . . . . . . . 9 6 . . . . . . 
    . . . . . 6 9 9 9 9 6 . . . . . 
    . . . . 6 6 9 9 9 9 9 6 . . . . 
    . . . . 6 9 9 d d d 9 9 6 . . . 
    . . . 9 9 9 d 1 1 1 d 9 9 . . . 
    . . . 6 9 d d 1 1 1 1 d 9 . . . 
    . . 6 6 9 d 1 1 1 1 d d 9 9 . . 
    . . 6 9 9 d 1 1 1 1 d 9 9 9 . . 
    . . 9 9 d 1 1 1 1 1 1 d 9 9 . . 
    . . 9 9 d 1 1 1 1 1 d d 9 9 . . 
    . . 9 9 d d 1 1 1 1 d 9 9 9 . . 
    . . . 6 9 d d 1 1 d 9 9 9 . . . 
    . . . 6 9 9 d 1 d 9 9 6 . . . . 
    . . . . 6 9 9 d 9 9 9 6 . . . . 
    . . . . . . . 9 9 6 6 . . . . . 
    . . . . . . . . . . . . . . . . 
    `,img`
        . . . . . . . . . . . . . . . .
        . . . . . 6 6 9 6 6 . . . . . .
        . . . . 9 9 9 d 9 9 6 9 . . . .
        . . . . 9 9 d 1 d d 9 9 6 . . .
        . . . 9 9 d 1 1 1 1 d 9 9 6 . .
        . . . 9 d 1 1 1 1 1 d 9 9 6 . .
        . . 9 9 9 d 1 1 1 d 9 9 6 . . .
        . . 6 9 9 d 1 1 1 1 d 9 9 9 . .
        . . 6 9 d 1 1 1 1 1 1 d 9 9 . .
        . . 6 9 d d 1 1 1 1 d 9 9 6 . .
        . . 9 9 9 9 d 1 1 1 d 9 6 . . .
        . . . 9 9 9 d d 1 1 1 d 9 6 . .
        . . . 9 9 9 9 9 d d d 9 6 . . .
        . . . . 9 9 6 9 9 9 9 9 . . . .
        . . . . . . . 6 6 6 6 . . . . .
        . . . . . . . . . . . . . . . .
    `], "传送门")
    let portal: Sprite = null
    let portalclock: number = -1

    let funcNextPortal = ()=>{}
    let nextMazeFunc = newRandomMaze

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=bornPlaceCR block="设定起点 $x 行 $y"
    //%x.defl=0 y.defl=0
    //%weight=99
    export function bornPlaceCR(x: number = 0, y: number = 0){
        curMaze.bornPlace = ()=>{
            if(Bullet.curPlayer != null){
                tiles.placeOnTile(Bullet.curPlayer, tiles.getTileLocation(x, y))
            }
            for(let s of sprites.allOfKind(SpriteKind.PlayerServant)){
                tiles.placeOnTile(s, tiles.getTileLocation(x, y))
            }
        }
    }

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=nextPortal block="设定传送门在图块列表列 $x 行 $y"
    //%x.defl=0 y.defl=0
    //%weight=80
    export function nextPortal(x: number = 0, y: number = 0){
        funcNextPortal = ()=>{
            if(portal == null){
                portal = sprites.create(img`
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . 1 1 . . . . . . .
                    . . . . . . . 1 1 1 . . . . . .
                    . . . . . . 1 1 1 1 . . . . . .
                    . . . . . 1 1 1 1 1 . . . . . .
                    . . . . 1 1 1 1 1 1 1 . . . . .
                    . . . . . . 1 1 1 1 . . . . . .
                    . . . . . . . 1 1 . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                `)
                tiles.placeOnTile(portal, tiles.getTileLocation(x, y))
                portal.setKind(SpriteKind.Portal)
                portalclock = setInterval(function() {
                    Helper.runAnimationAt("传送门", portal.x, portal.y)
                }, 300)
            }
        }
    }

    //%block
    //%blockNamespace=迷宫
    //%group="放置迷宫物体"
    //%blockId=nextPortal2 block="设定传送门在随机位置的$tile 图块上"
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true
    //%x.defl=0 y.defl=0
    //%weight=80
    export function nextPortal2(tile: Image){
        funcNextPortal = ()=>{
            if(portal == null){
                portal = sprites.create(img`
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . 1 1 . . . . . . .
                    . . . . . . . 1 1 1 . . . . . .
                    . . . . . . 1 1 1 1 . . . . . .
                    . . . . . 1 1 1 1 1 . . . . . .
                    . . . . 1 1 1 1 1 1 1 . . . . .
                    . . . . . . 1 1 1 1 . . . . . .
                    . . . . . . . 1 1 . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                `)
                tiles.placeOnRandomTile(portal, tile)
                portal.setKind(SpriteKind.Portal)
                portalclock = setInterval(function() {
                    Helper.runAnimationAt("传送门", portal.x, portal.y)
                }, 300)
            }
        }
    }

    export enum mazeKind{
        //%block="随机迷宫"
        random,
        //%block="指定迷宫"
        name
    }

    //%block
    //%blockNamespace=迷宫
    //%group="下一层迷宫"
    //%blockId=nextMazeOfPortal block="设定传送门的传送目标为%m=mazeKind ||%name"
    //%weight=80
    export function nextMazeOfPortal(m: mazeKind, name: string=null){
        if(m == mazeKind.random){
            nextMazeFunc = newRandomMaze
        }
        else{
            nextMazeFunc = ()=>newNextMaze(name)
        }
    }

    //传送到下一迷宫
    function onoverlapPortal(){
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Portal, function(s: Sprite, d: Sprite) {
            if(s != Bullet.curPlayer){
                return
            }
            portal.setKind(null)
            portal.destroy()
            portal = null
            clearInterval(portalclock)
            portalclock = -1
            setTimeout(()=>{
                nextMazeFunc()
            }, 300)
        })
    }

    onoverlapPortal()

}
