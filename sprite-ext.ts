namespace SpriteKind{
    export const PlayerBullet = SpriteKind.create()
    export const PlayerWeapon = SpriteKind.create()
    export const PlayerServant = SpriteKind.create()
    export const EnemyBullet = SpriteKind.create()
    export const BOSS = SpriteKind.create()
}
namespace Helper{
    //------------- 精灵注册/定义 -------------
    export class mySprite{
        img: Image //图像
        cb: (sprite: Sprite)=>void //定义
        bulletoverlap: ((s: Sprite, o: Sprite)=>void)[] //与弹射物的碰撞行为
        constructor(img: Image, cb: (sprite: Sprite)=>void){
            this.img = img
            this.cb = cb
        }
    }

    export class mysprites{
        k: number //拓展精灵类型："玩家"、"敌人"、"武器"、"弹射物"
        v: {[key: string]: mySprite; } = {}
        constructor(k: extSpriteKind, v: {[key: string]: mySprite; } = null){
            this.k = k
            if(v == null){
                this.v = {}
            }
            else{
                this.v = v
            }
        }
    }

    const spriteKind = ["玩家","敌人","武器","弹射物"]

    export const CUSTOM_SPRITE_KIND_INITIALIZER :{[k:number]:any} = {}

    export enum extSpriteKind{
        Player = 0,
        Enemy = 1,
        Weapon = 2,
        Projectile = 3
    }

    export function setSprite(kind: mysprites, img: Image, name:string, cb:(sprite: Sprite)=>void){
        if(kind.v[name] != undefined){
            console.log("定义" + spriteKind[kind.k] + "时发生命名冲突："+name)
            return
        }
        let sprite = new mySprite(img, cb)
        kind.v[name] = sprite
    }

    function newInstanceOf(customSpriteKind:mysprites, img:Image) :Sprite  {
        return new CUSTOM_SPRITE_KIND_INITIALIZER[customSpriteKind.k](img)
    }


    function _createSprite(customSpriteKind:mysprites, img:Image, spriteKind?:number) {
        const scene = game.currentScene();
        const sprite = newInstanceOf(customSpriteKind, img)
        scene.physicsEngine.addSprite(sprite);

        // run on created handlers
        scene.createdHandlers
            .filter(h => h.kind == spriteKind)
            .forEach(h => h.handler(sprite));

        return sprite
    }

    export function createSprite(kind: mysprites, name: string, x: number, y: number){
        let w = kind.v[name]
        if(w == undefined){
            console.log("创建的"+spriteKind[kind.k]+"'"+ name + "' 未定义!")
            return null
        }
        // let sprite = sprites.create(w.img.clone())
        let sprite = _createSprite(kind, w.img)
        tiles.placeOnTile(sprite, tiles.getTileLocation(x, y))
        return sprite
    }

    //------------- 精灵死亡判定 -------------
    export function isDestroyed(sprite: Sprite){
        return sprite.flags & sprites.Flag.Destroyed
    }
}
