namespace Character{
    //------------ 扩展精灵 ------------
    export class Character extends Sprite{
        dir: number //方向.0:下，1:左，2:上，3:右
        hpbar: StatusBarSprite //血条
        hp: number //血量上限
        def: number //防御=100/hp
        speed: number //移动速度
        walkimgs: Image[][] //走路动画
        attackimg: Image[][] //攻击动画
        standimg: Image[][] //站立动画
        attack: number //攻击状态
        hurted: number //受伤状态
        hitrecclock: number //硬直时钟
        attachBullet: Sprite[] //与发射者关联的弹射物(只需要判断精灵是否销毁、不需要拓展弹射物的属性
    }

    export function reset(c: Character){
        c.dir = 0
        c.speed = 50
        c.hurted = 0
        c.attack = 0
        c.walkimgs = [[],[],[],[]]
        c.attackimg = [[],[],[],[]]
        c.standimg = [[],[],[],[]]
        c.attachBullet = []
        c.hitrecclock = -1
        c.hp = 100
        c.def = 100/c.hp
        c.hpbar = statusbars.create(20, 4, StatusBarKind.Health)
        c.hpbar.attachToSprite(c)
        c.hpbar.setColor(2, 13)
        c.hpbar.setBarBorder(1, 11)
        c.hpbar.setOffsetPadding(0, 2)
    }

    export enum animKind{
        //% block="走路"
        walk,
        //% block="攻击"
        attack,
        //% block="站立"
        stand
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

}