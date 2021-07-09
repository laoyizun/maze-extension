//%icon="\uf113" color="#6A6FEA"
namespace 敌人{}
namespace Enemy{
//================== 拓展敌人 ==================
    export class Enemy extends Character.Character{   
        skills: ((tempVar: Helper.tempVarDic, sprite: Sprite)=>void)[] //技能池
        move: number //移动标记
        followclock: number //跟随时钟
        attackclock: number //攻击模式时钟
        moveto: number[] //当前移动的目的地. [0]:列行/xy, [1]:列/x, [2]:行/y
        blastAnim: string //死亡动画
        next: (e: Enemy)=>void //下一个行动

        actId: number //下一个行动的序号
        sid: string //唯一标记
        blastSkill: (tempVar: Helper.tempVarDic, sprite: Sprite)=>void //死亡技能
        spoils: ((tempVar: Helper.tempVarDic, sprite: Sprite)=>void)[] //击杀奖励
    }

    function reset(e: Enemy){
        Character.reset(e)
        e.skills = []
        e.spoils = []
        e.move = 0
        e.followclock = -1
        e.attackclock = -1
        e.moveto = [-1, 0, 0]
        e.next = null
        e.actId = 0
        e.sid = Helper.tostring(randint(-2147483648, 2147483647))
        let f = true
        let clock: number
        clock = setInterval(function() {
            if((e.flags & sprites.Flag.Destroyed)){
                clearInterval(clock)
            }
            else if(e.hurted == 0){
                if(Math.abs(e.vx) < 1 && Math.abs(e.vy) < 1){
                    if(f){
                        animation.runImageAnimation(e, e.standimg[e.dir], 100, true)
                        f = false
                    }
                    return
                }
                let _dir = e.dir
                let lr: number
                let tb: number
                lr = e.vx > 0 ? 3 : 1
                tb = e.vy > 0 ? 0 : 2
                if(Math.abs(e.vx) > Math.abs(e.vy))
                {
                    e.dir = lr
                }
                else{
                    e.dir = tb
                }
                if(_dir != e.dir){
                    animation.runImageAnimation(e, e.walkimgs[e.dir], 100, true)
                    f = true
                }
            }
        }, 0)
    }

    //------------- 敌人注册/定义 -------------
    const enemyKey = Helper.extSpriteKind.Enemy
    let enemys: Helper.mysprites

    //export let Bullet.getCurEnemyRoom(): {[key: string]: Enemy; } = {}
    export let curEnemyNums: number = 0
    export let curBossNums: number = 0

    //%block
    //%group="自定义敌人"
    //%blockNamespace=敌人 
    //%blockId=setEnemy block="设置敌人 %img=screen_image_picker 命名为%name"
    //%weight=81
    //%inlineInputMode=inline
    //%draggableParameters="enemy"
    export function setEnemy(img: Image, name:string, cb:(enemy: Enemy)=>void){
        if(enemys == undefined){
            enemys = new Helper.mysprites(enemyKey, IntegrateGame.defExtSprite[enemyKey])
        }
        Helper.setSprite(enemys, img, name, cb)
        IntegrateGame.defExtSprite[enemyKey][name] = enemys.v[name]
    }

    let curBoss: Enemy = null

    export function setCurBoss(e: Sprite){
        curBoss = <Enemy>e
    }

    export function createEnemy(name: string, unimportant: boolean, boss: boolean, reinforcements: boolean){
        let enemy = <Enemy>Helper.createSprite(enemys, name, 0, 0)
        if(enemy == null){
            return null
        }
        reset(enemy)
        enemys.v[name].cb(enemy)
        if(reinforcements == true){
            enemy.setKind(SpriteKind.PlayerServant)
            enemy.hpbar.setColor(4, 13)
        }
        else {
            if(boss && curBoss == null){
                curBossNums++
                enemy.setKind(SpriteKind.BOSS)
                curBoss = enemy
            }
            else{
                enemy.setKind(SpriteKind.Enemy)
            }
            if(!unimportant){
                while(Bullet.getCurEnemyRoom()[enemy.sid] != undefined){
                    enemy.sid = Helper.tostring(randint(-2147483648, 2147483647))
                }
                Bullet.getCurEnemyRoom()[enemy.sid] = enemy
                ++curEnemyNums
            }
        }
        return enemy
    }

    export enum sKind{
        //% block="新技能"
        skill,
        //% block="死亡技能"
        blast,
        //% block="击杀奖励"
        spoils
    }

    //%block
    //%group="能力"
    //%blockNamespace=敌人
    //%blockId=addSKill block="设置敌人%b=variables_get(enemy) %k 为"
    //%weight=89
    //%draggableParameters="tempVar sprite"
    //% topblock=false
    //% handlerStatement=true
    export function addSKill(e: Enemy, k:sKind, skill: (tempVar: Helper.tempVarDic, sprite: Sprite)=>void){
        if(k == sKind.skill){
            e.skills.push(skill)
        }
        else if(k == sKind.blast){
            e.blastSkill = skill
        }
        else if(k == sKind.spoils){
            e.spoils.push(skill)
        }
    }

    export enum aKind{
        //% block="血量"
        hp,
        //% block="速度"
        speed
    }
    
    //%block
    //%group="能力"
    //%blockNamespace=敌人
    //%blockId=setEnemyAbility block="设置敌人 %b=variables_get(enemy) %k 为 %v"
    //%v.defl=100
    //%weight=77
    //%inlineInputMode=inline
    export function setEnemyAbility(b: Enemy, k: aKind, v: number){
        if(k == aKind.hp){
            b.def = 100/v
        }
        else if(k == aKind.speed){
            b.speed = v
        }
    }

    //%block
    //%blockNamespace=敌人
    //%group="能力"
    //%blockId=dropWeapon block="掉落装备 击杀%b=variables_get(enemy) 得到武器%name ||概率%d"
    //%weight=76
    //%d.defl=100
    export function dropWeapon(e: Sprite, name: string, d = 100){
        (<Enemy>e).spoils.push(()=>{
            if(Math.percentChance(d)){
                let w = Weapon.makeWeapon(name, 0, 0)
                w.setPosition(e.x, e.y)
            }
        })
    }

    //%block
    //%blockNamespace=敌人
    //%group="参数"
    //%blockId=getBoss block="当前boss"
    export function getBoss(){
        return curBoss
    }

    //%block
    //%group="参数"
    //%blockNamespace=敌人 
    //%blockId=enemyHp block="%b=variables_get(enemy)当前血量"
    //%weight=99
    export function enemyHp(b: Enemy){
        return b.hpbar.value/b.def
    }

    //%block
    //%group="参数"
    //%blockNamespace=敌人 
    //%blockId=spriteToEnemy block="将精灵%b=variables_get(sprite)强制转换为敌人"
    //%weight=99
    export function spriteToEnemy(b: Sprite){
        return <Enemy>b
    }

    //------------- 迷宫相关 -------------

    //在s附近d范围内搜索最近敌人
    //%block
    //%blockNamespace=敌人
    //%group="搜索"
    //%blockId=nearestEnemy block="距离%s=variables_get(player) 最近的怪物|| 搜索范围 %d"
    //%d.defl=100
    export function nearestEnemy(s: Sprite, d: number = 2147483647){
        return Bullet.nearestEnemy(s, d)
    }


    export function nearestServant(s: Sprite, d: number = 2147483647){
        return Bullet.nearestServant(s, d)
    }

    //在s附近d范围内搜索敌人数量
    //%block
    //%blockNamespace=敌人
    //%group="搜索"
    //%blockId=enemyNums block="侦查 %s=variables_get(player) 附近的怪物数量|| 搜索范围 %d"
    //%d.defl=100
    export function enemyNums(s: Sprite, d: number = 2147483647){
        let ret = 0
        for(let key of Object.keys(Bullet.getCurEnemyRoom())){
            let e = Bullet.getCurEnemyRoom()[key]
            if(e != undefined && Helper.distance(s, e) <= d){
                ++ret
            }
        }
        return ret
    }
}
