namespace SpriteKind{
    export const weapon = SpriteKind.create()
}
//%icon="\uf132" color="#B6392F"
namespace 武器{}
namespace Weapon{
//================== 拓展武器 ==================
    export class Weapon extends Sprite{
        skill: (tempVar: Helper.tempVarDic, that: Sprite)=>void //绑定技能
        passiveSkill: ({time: number, interval: number, 
                        skill: (tempVar: Helper.tempVarDic, that: Sprite)=>void})[] //被动技能
        pskillclock: {timeout: number, interval: number}[] //被动技能时钟
        cd: number //技能cd.ms
        cdclock: number //技能cd计时
        images: Image[] //不同方向的图像
        atkimages: Image[][] //攻击时不同方向的图像
        dir: number //当前images下标
        bulletNum: number //当前子弹数量(耐久).undefined=>无限
        maxNum: number //子弹数量(耐久)上限.undefined=>无限
        damage: number //近战伤害
        hitrec: number //造成硬直
        backoff: number //击退距离
        angle: number //攻击角度
        attack: number //攻击状态
        offset: {x: number, y: number}[] //跟随精灵时四个方向的xy偏移值
        name:string //名称
        author: string //作者
        desc: string //介绍
    }
    function reset(w: Weapon){
        w.cd = 200
        w.cdclock = -1
        w.attack = 0
        w.passiveSkill = []
        w.pskillclock = []
        w.images = [] //下、左、上、右
        w.atkimages = [[],[],[],[]]
        w.dir = 1
        w.damage = 5
        w.hitrec = 200
        w.backoff = 0
        w.angle = 90
        let img = w.image.clone()
        w.images[0] = Helper.transformImage(img, 90, Helper.xy0.cent)
        w.images[1] = img
        w.images[2] = Helper.transformImage(img, -90, Helper.xy0.cent)
        w.images[3] = Helper.transformImage(img, 180, Helper.xy0.cent)
        w.atkimages[0].push(w.images[0])
        w.atkimages[0].push(Helper.transformImage(w.images[0], w.angle/2, Helper.xy0.cent))
        w.atkimages[0].push(Helper.transformImage(w.images[0], w.angle, Helper.xy0.cent))
        w.atkimages[1].push(w.images[1])
        w.atkimages[1].push(Helper.transformImage(w.images[1], w.angle/2, Helper.xy0.cent))
        w.atkimages[1].push(Helper.transformImage(w.images[1], w.angle, Helper.xy0.cent))
        w.atkimages[2].push(w.images[2])
        w.atkimages[2].push(Helper.transformImage(w.images[2], w.angle/2, Helper.xy0.cent))
        w.atkimages[2].push(Helper.transformImage(w.images[2], w.angle, Helper.xy0.cent))
        w.atkimages[3].push(w.images[3])
        w.atkimages[3].push(Helper.transformImage(w.images[3], w.angle/2, Helper.xy0.cent))
        w.atkimages[3].push(Helper.transformImage(w.images[3], w.angle, Helper.xy0.cent))
        w.offset = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}]
    }
    //------------- 注册/定义 -------------
    const weaponKey = Helper.extSpriteKind.Weapon
    let weapons: Helper.mysprites

    //%block
    //%group="自定义武器"
    //%blockNamespace=武器 
    //%blockId=setWeapons block="自定义武器集合 标记名为%name"
    //%weight=100
    export function setWeapons(name:string, cb:()=>void){
        cb()
    }

    //%block
    //%group="自定义武器"
    //%blockNamespace=武器 
    //%blockId=setWeapon block="设置武器 %img=screen_image_picker 命名为%name"
    //%weight=81
    //%inlineInputMode=inline
    //%draggableParameters="weapon"
    //% topblock=false
    //% handlerStatement=true
    export function setWeapon(img: Image, name:string, cb:(weapon: Weapon)=>void){
        if(weapons == undefined){
            weapons = new Helper.mysprites(weaponKey, IntegrateGame.defExtSprite[weaponKey])
        }
        Helper.setSprite(weapons, img, name, cb)
        IntegrateGame.defExtSprite[weaponKey][name] = weapons.v[name]
    }

    export function makeWeapon(name: string, x: number, y: number){
        let weapon = <Weapon>Helper.createSprite(weapons, name, x, y)
        if(weapon == null){
            console.log("fail")
            return null
        }
        reset(weapon)
        weapon.name = name
        weapons.v[name].cb(weapon)
        weapon.setKind(SpriteKind.weapon)
        return weapon
    }

    //%block
    //%group="自定义武器"
    //%blockNamespace=武器
    //%blockId=setWeaponDesc block="设置武器%weapon=variables_get(weapon) 作者 %author 介绍文字 %desc"
    //%weight=81
    export function setWeaponDesc(weapon: Weapon, author: string, desc: string) {
        weapon.author = author
        weapon.desc = desc
    }

    export enum weaponP{
        //% block="伤害"
        damage,
        //% block="技能cd(ms)"
        cd,
        //% block="耐久"
        nums,
        //% block="硬直(ms)"
        hitrec,
        //% block="击退距离"
        backoff,
        //% block="攻击转角(逆时针)"
        angle
    }

    //%block
    //%group="武器属性"
    //%blockNamespace=武器
    //%blockId=setWeaponP block="设置武器%w=variables_get(weapon) 属性 %k=weaponP 为 %v"
    //%v.defl=0
    //%weight=78
    export function setWeaponP(w:Weapon, k: weaponP, v: number){
        if(k == weaponP.damage){
            w.damage = v
        }
        else if(k == weaponP.cd){
            w.cd = v
        }
        else if(k == weaponP.backoff){
            w.backoff = v
        }
        else if(k == weaponP.hitrec){
            w.hitrec = v
        }
        else if(k == weaponP.nums){
            w.bulletNum = w.maxNum = v
        }
        else if(k == weaponP.angle){
            w.angle = v
            w.atkimages = [[],[],[],[]]
            w.atkimages[0].push(w.images[0])
            w.atkimages[0].push(Helper.transformImage(w.images[0], w.angle/2, Helper.xy0.cent))
            w.atkimages[0].push(Helper.transformImage(w.images[0], w.angle, Helper.xy0.cent))
            w.atkimages[1].push(w.images[1])
            w.atkimages[1].push(Helper.transformImage(w.images[1], w.angle/2, Helper.xy0.cent))
            w.atkimages[1].push(Helper.transformImage(w.images[1], w.angle, Helper.xy0.cent))
            w.atkimages[2].push(w.images[2])
            w.atkimages[2].push(Helper.transformImage(w.images[2], w.angle/2, Helper.xy0.cent))
            w.atkimages[2].push(Helper.transformImage(w.images[2], w.angle, Helper.xy0.cent))
            w.atkimages[3].push(w.images[3])
            w.atkimages[3].push(Helper.transformImage(w.images[3], w.angle/2, Helper.xy0.cent))
            w.atkimages[3].push(Helper.transformImage(w.images[3], w.angle, Helper.xy0.cent))
        }
    }

    //%block
    //%group="参数"
    //%blockNamespace=武器 
    //%blockId=weaponHp block="武器%b=variables_get(weapon)当前耐久度"
    //%weight=78
    export function weaponHp(b: Weapon){
        return b.bulletNum != undefined ? b.bulletNum : 2147483647
    }

    //%block
    //%group="参数"
    //%blockNamespace=武器 
    //%blockId=spriteToWeapon block="将精灵%b=variables_get(sprite)强制转换为武器"
    //%weight=99
    export function spriteToWeapon(b: Sprite){
        return <Weapon>b
    }


    //%block
    //%blockNamespace=武器 
    //%group="技能设置"
    //%blockId=skillSet block="设置武器 %w=variables_get(weapon) 技能"
    //%weight=79
    //%draggableParameters="tempVar sprite"
    //% topblock=false
    //% handlerStatement=true
    export function weaponSkill(w: Weapon, skill: (tempVar: Helper.tempVarDic, sprite: Sprite)=>void){
        w.skill = skill
    }

    //%block
    //%blockNamespace=武器 
    //%group="技能设置"
    //%blockId=setPassiveSkill block="设置武器 %w=variables_get(weapon) 被动技能 持续时间%t s 触发间隔%i ms"
    //%weight=78
    //%t.defl=1000 i.defl=200
    //%draggableParameters="tempVar sprite"
    //% topblock=false
    //% handlerStatement=true
    export function setPassiveSkill(w: Weapon, t: number, i: number, 
    skill: (tempVar: Helper.tempVarDic, sprite: Sprite)=>void){
        w.passiveSkill.push({time: t*1000, interval: i, skill: skill})
    }

    export enum dirKind{
        //% block="下"
        down = 0,
        //% block="左"
        left = 1,
        //% block="上"
        up = 2,
        //% block="右"
        right = 3,
    }

    //%block
    //%blockNamespace=武器 
    //%group="技能设置"
    //%blockId=setoffset block="设置武器 %w=variables_get(weapon) %dir 方向的位置偏移x%x y%y"
    //%x.defl=0 y.defl=0
    //%weight=77
    //%inlineInputMode=inline
    export function setoffset(w: Weapon, dir: dirKind, x: number = 0, y: number = 0){
        w.offset[dir] = {x, y}
    }

    //% blockId=setNum block="修改%s=variables_get(weapon)的耐久度 以%d" 
    //% group="特殊效果"
    //%blockNamespace=弹射物 
    //% d.defl=-1
    //% weight=99
    export function setNum(s: Sprite, d: number){
        //能破坏武器的弹射物
        let w = <Weapon.Weapon>s
        if(w.bulletNum != undefined){
            w.bulletNum += d
        }
    }
}