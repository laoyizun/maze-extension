namespace Enemy{
    //------------- 怪物组 -------------
    export class monsters{
        members: {e: string, n: number}[] //怪物成员
        action: ((e: Enemy)=>void)[] //行为模式

        occurrence: number = 100 //出现概率
        interval: number = 1000 //怪物群间的出现间隔
        continuous: boolean = false //源源不断： 持续生成
        unimportant: boolean = false //无关紧要：不计入怪物数量、不随boss死亡、不被自动瞄准
        reinforcements: boolean = false //归属玩家：kind为Player
        boss: boolean = false //房间BOSS：击败就能进入下一层
        constructor(){
            this.occurrence = 100
            this.interval = 1000
            this.members = []
            this.action = []
            this.continuous = this.unimportant = this.reinforcements = this.boss = false
        }
        //按行为模式行动
        act(e: Enemy, actions: ((e: Enemy)=>void)[]){
            e.actId = 0
            actions[0](e)
        }
    }

    export let monstersList: {[key: string]: monsters; } = {}

    export let actionList: {[key: string]: ((e: Enemy)=>void)[]; } = {}

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setMonsters0 block="定义怪物小队"
    //%weight=1000
    //%draggableParameters="monster"
    export function setMonsters0(f: ()=>void){
        f()
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setMonsters block="定义怪物小队 命名为%name"
    //%weight=99
    //%draggableParameters="monster"
    //% topblock=false
    //% handlerStatement=true
    export function setMonsters(name: string, f: (monster: monsters)=>void){
        if(monstersList[name] != undefined){
            console.log("定义怪物小队时发生命名冲突："+name)
            return
        }
        let m = new monsters
        monstersList[name] = m
        f(m)
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=addMember block="添加成员 怪物小队%m=variables_get(monster) 添加敌人%e ||数量为%n"
    //%n.defl=1
    //%weight=80
    export function addMember(m: monsters, e: string, n: number = 1){
        m.members.push({e, n})
    }

    export enum msKind{
        //% block="出现概率(0~100)"
        occurrence_probability,
        //% block="出现间隔(ms)"
        occurrence_interval
    }

    export enum msKind2{
        //% block="源源不断"
        continuous,
        //% block="无关紧要"
        unimportant,
        //% block="归属玩家"
        reinforcements,
        //% block="房间boss"
        boss,
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setMonstersV block="设置属性 怪物小队%m=variables_get(monster) %k 为 %v"
    //%v.defl=100
    //%weight=79
    export function setMonstersV(m: monsters, k: msKind, v: number){
        if(k == msKind.occurrence_probability){
            m.occurrence = v
        }else if(k == msKind.occurrence_interval){
            m.interval =v
        }
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setMonstersV2 block="设置属性 怪物小队%m=variables_get(monster) %k 为 %v=toggleOnOff"
    //%v.defl=true
    //%weight=79
    export function setMonstersV2(m: monsters, k: msKind2, v: boolean){
        if(k == msKind2.continuous){
            m.continuous = v
        }else if(k == msKind2.reinforcements){
            m.reinforcements =v
        }
        else if(k == msKind2.unimportant){
            m.unimportant =v
        }
        else if(k == msKind2.boss){
            m.boss =v
        }
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setActionM block="添加行动 怪物小队%m=variables_get(monster) 完成上一动作并等待%t 秒后执行(移动/攻击/跳转)"
    //%weight=78
    //%t.defl=1
    //%draggableParameters="enemy"
    //% topblock=false
    //% handlerStatement=true
    export function setActionM(m: monsters, t: number, f: (enemy: Enemy)=>void){
        m.action.push((e: Enemy)=>{
            setTimeout(()=>{
                f(e)
            }, t*1000)
            if(e.actId < m.action.length){
                let t = e.actId++
                e.next = m.action[t]
            }
            else {
                e.next = null
            }
        })
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setActionM2 block="添加行动 怪物小队%m=variables_get(monster)行动模式添加%name"
    //%weight=77
    export function setActionM2(m: monsters, name: string){
        if(actionList[name] == undefined){
            console.log("行动模式"+name+"未定义!")
        }
        else{
            let a = actionList[name]
            for(let x of a){
                m.action.push(x)
            }
        }
    }

    //%block
    //%group="怪物小队"
    //%blockNamespace=敌人
    //%blockId=setActionName block="将怪物小队%m=variables_get(monster)的行动模式命名为%name"
    //%weight=77
    export function setActionName(m: monsters, name: string){
        if(actionList[name] != undefined){
            console.log("行为模式发生命名冲突："+name)
        }
        else{
            actionList[name] = m.action
        }
    }

    //------------- 移动模式 -------------
    function reach(e: Enemy){
        if(e.move == 1 && e.followclock == -1){
            return
        }
        e.moveto = [-1, 0, 0]
        if(e.attack == 0 && e.next != null && !(e.flags & sprites.Flag.Destroyed)){
            e.next(e)
        }
    }
    function enemyReach(kind: number){
        scene.onPathCompletion(kind, function(sprite: Sprite, location: tiles.Location) {
            (<Enemy>sprite).move = 0
            reach(<Enemy>sprite)
        })
    }
    enemyReach(SpriteKind.PlayerServant)
    enemyReach(SpriteKind.Enemy)
    enemyReach(SpriteKind.BOSS)

    //------------- 寻路 -------------
    export enum crORxy{
        //%block="图块列行"
        cr = 0,
        //%block="坐标xy"
        xy = 1
    }

    //%block
    //%blockNamespace=敌人
    //%group="移动"
    //%blockId=enemyMoveTo block="移动 敌人%e=variables_get(enemy) 移动到%k $c $r ||速率%s"
    //%s.defl=50
    //%inlineInputMode=inline
    export function enemyMoveTo(e: Enemy, k: crORxy, c: number, r: number, s: number = 50){
        if(k == crORxy.xy){
            c = Maze.toCR(c)
            r = Maze.toCR(r)
        }
        if(Maze.isWall(c, r) || Maze.outofMap(c, r)){
            reach(e)
            return
        }
        e.move = 1
        e.moveto = [crORxy.cr, c, r]
        scene.followPath(e, scene.aStar(tiles.getTileLocation(Maze.toCR(e.x), Maze.toCR(e.y)), tiles.getTileLocation(c, r)), s)
    }

    //%block
    //%blockNamespace=敌人
    //%group="移动"
    //%blockId=randomMove block="移动 敌人%e=variables_get(enemy) 移动到随机位置的$tile 图块上"
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true"
    export function randomMove(e: Enemy, tile: Image){
        let tsprite = sprites.create(img`
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . b 9 9 b . . .
            . . . . . . b b b b b b . . . .
            . . . . . b b 9 9 9 9 9 b . . .
            . b b b b b 9 9 9 9 9 9 9 b . .
            . b d 9 b 9 9 9 9 9 9 9 9 b . .
            . . b 9 9 b 9 d 1 f 9 d 4 f . .
            . . b d 9 9 b 1 f f 9 4 4 c . .
            b b d b 9 9 9 d f b 4 4 4 4 b .
            b d d c d 9 9 b 9 4 4 4 4 4 4 b
            c d d d c c b 9 9 9 9 9 9 9 b .
            c b d d d d d 9 9 9 9 9 9 9 b .
            . c d d d d d d 9 9 9 9 9 d b .
            . . c b d d d d d 9 9 9 b b . .
            . . . c c c c c c c c b b . . .
        `)
        tsprite.setFlag(SpriteFlag.Ghost, true)
        tsprite.setFlag(SpriteFlag.Invisible, true)
        tiles.placeOnRandomTile(tsprite, tile)
        let x = tsprite.x
        let y = tsprite.y
        tsprite.destroy()
        enemyMoveTo(e, crORxy.xy, x, y)
    }

    //%block
    //%blockNamespace=敌人
    //%group="移动"
    //%blockId=followSprite block="移动 敌人%e=variables_get(enemy) 跟随%followSprite=variables_get(sprite) ||速率%s"
    //%s.defl=50
    //%inlineInputMode=inline
    export function followSprite(e: Enemy, followSprite: Sprite, s: number = 50){
        if(e.followclock == -1){
            e.followclock = setInterval(()=>{
                let c = Maze.toCR(followSprite.x)
                let r = Maze.toCR(followSprite.y)
                e.moveto = [crORxy.cr, c, r]
                let path = scene.aStar(tiles.getTileLocation(Maze.toCR(e.x), Maze.toCR(e.y)), tiles.getTileLocation(c, r))
                scene.followPath(e, path, s)
            }, 1000)
        }
        if(e.next != null && !(e.flags & sprites.Flag.Destroyed)){
            e.next(e)
        }
    }

    //%block
    //%blockNamespace=敌人
    //%group="移动"
    //%blockId=stopMove block="停止移动 敌人%e=variables_get(enemy)"
    export function stopMove(e: Enemy){
        e.moveto = [-1, 0, 0]
        clearInterval(e.followclock)
        e.followclock = -1
        enemyMoveTo(e, crORxy.xy, e.x, e.y)
    }
    //------------- 攻击模式 -------------
    function stopAtk(e: Enemy){
        e.attack = 0
        animation.runImageAnimation(e, e.standimg[e.dir], 100, true)
        if((e.move == 0 || e.followclock != -1) && e.next != null && !(e.flags & sprites.Flag.Destroyed)){
            e.next(e)
        }
    }

    function attack(e: Enemy, t: number){
        e.attack = 1
        animation.runImageAnimation(e, e.attackimg[e.dir])
        setTimeout(()=>{
            stopAtk(e)
        }, t)
    }

    //%block
    //%blockNamespace=敌人
    //%group="攻击"
    //%blockId=randomAtk block="攻击 敌人%e=variables_get(enemy)随机使用技能 ||%t 秒"
    //%t.defl=1
    export function randomAtk(e: Enemy, t: number = 1){
        skillAtk(e, randint(0, e.skills.length-1), t)   
    }

    //%block
    //%blockNamespace=敌人
    //%group="攻击"
    //%blockId=skillAtk block="攻击 敌人%e=variables_get(enemy)使用技能%n ||%t 秒"
    //%t.defl=1 n.defl=0
    export function skillAtk(e: Enemy, n: number, t: number = 1){
        if(n >= e.skills.length || n < 0){
            stopAtk(e)
            return
        }
        let clock: number
        clock = setInterval(()=>{
            if((e.flags & sprites.Flag.Destroyed)){
                clearInterval(clock)
            }
            else if((e.attack | e.hurted) == 0){
                clearInterval(clock)
                attack(e, t*1000)
                let f = e.skills[n]
                f(new Helper.tempVarDic(), e)
            }
        }, 100)
    }

    //------------- 动作跳转 -------------
    //%block
    //%blockNamespace=敌人
    //%group="跳转"
    //%blockId=jmp block="怪物小队%m=variables_get(monster) 的成员%e=variables_get(enemy) 跳转执行行动%n"
    //%n.defl=0
    export function jmp(m: monsters, e: Enemy, n: number){
        if(n < 0 || n >= m.action.length || (e.flags & sprites.Flag.Destroyed)){
            return
        }
        e.actId = n
        m.action[n](e)
    }

    //击杀后清算
    export function _enemyDie(e: Enemy){
        if(!(e.flags & sprites.Flag.Destroyed)){
            e.destroy()
        }
        //clearInterval(e.move)
        clearInterval(e.attackclock)
        stopMove(e)
        e.attackclock = -1
        if(e.blastAnim != undefined && e.blastAnim != null){
            Helper.runAnimation(e, e.blastAnim)
        }
        if(e.blastSkill != undefined){
            e.blastSkill(new Helper.tempVarDic(), e)
        }
        if(e.spoils != undefined){
            for(let s of e.spoils){
                s(new Helper.tempVarDic(), e)
            }
        }
    }

    //友军阵亡
    sprites.onDestroyed(SpriteKind.PlayerServant, function(e: Enemy) {
        _enemyDie(e)
    })

    //干掉普通小怪
    sprites.onDestroyed(SpriteKind.Enemy, function(e: Enemy) {
        _enemyDie(e)
        if(Bullet.getCurEnemyRoom()[e.sid] != undefined){
            Bullet.getCurEnemyRoom()[e.sid] = undefined
            if(--curEnemyNums <= 0){
                Maze.createMonsters()
            }
        }
    })

    //干掉boss
    sprites.onDestroyed(SpriteKind.BOSS, function(e: Enemy) {
        setCurBoss(null)
        _enemyDie(e)
        if(Bullet.getCurEnemyRoom()[e.sid] != undefined){
            Bullet.getCurEnemyRoom()[e.sid] = undefined
        }
        if(--curBossNums <= 0){
            curEnemyNums = 0
            while(Maze.curMaze.clock.length > 0){
                let c = Maze.curMaze.clock.removeAt(0)
                clearInterval(c)
            }
            for(let key of Object.keys(Bullet.getCurEnemyRoom())){
                if(Bullet.getCurEnemyRoom()[key] == undefined){
                    continue
                }
                _enemyDie(<Enemy>Bullet.getCurEnemyRoom()[key])
                Bullet.getCurEnemyRoom()[key] = undefined
            }
            Maze.createMonsters()
        }
    })
}