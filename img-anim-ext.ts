//%icon="\uf008" color="#BCE190"
namespace 动画{}
namespace Helper{
    //------------- 旋转图像 -------------
    export enum xy0{
        //% block="中心"
        cent,
        //% block="左上"
        lt,
        //% block="右上"
        rt,
        //% block="左下"
        lb,
        //% block="右下"
        rb,
    }
    //%block
    //%group="图像处理"
    //%blockNamespace=动画
    //%blockId=transformImage block="图像%img=screen_image_picker逆时针旋转%angle 度||以%xy=xy0为旋转中心"
    //%weight=81
    //%inlineInputMode=inline
    export function transformImage(img: Image, angle: number, xy: xy0 = xy0.cent){
        let x0: number
        let y0: number
        angle = angle/57.3
        const sina = Math.sin(angle)
        const cosa = Math.cos(angle)
        //旧算新
        let _x = (x: number, y: number)=>{
            return (x - x0)*cosa + (y - y0)*sina + x0
        }
        let _y = (x: number, y: number)=>{
            return -(x - x0)*sina + (y - y0)*cosa + y0
        }
        let newWidth: number
        let newHeight: number
        if(xy == xy0.cent){
            x0 = Math.floor(img.width/2)
            y0 = Math.floor(img.height/2)
            //右上
            const rtx = _x(img.width-1, 0)
            const rty = _y(img.width-1, 0)
            //左下
            const lbx = _x(0, img.height-1)
            const lby = _y(0, img.height-1)
            //左上
            const ltx = _x(0, 0)
            const lty = _y(0, 0)
            //右下
            const rbx = _x(img.width-1, img.height-1)
            const rby = _y(img.width-1, img.height-1)
            newWidth = Math.floor(Math.max(Math.abs(rtx-lbx), Math.abs(ltx-rbx))+1)
            newHeight = Math.floor(Math.max(Math.abs(rty-lby), Math.abs(lty-rby))+1)
        }
        else {
            if(xy == xy0.lt){
                x0 = 0
                y0 = 0
            }
            else if(xy == xy0.rt){
                x0 = img.width-1
                y0 = 0
            }
            else if(xy == xy0.lb){
                x0 = 0
                y0 = img.height-1
            }
            else { //if(xy == xy0.rb)
                x0 = img.width-1
                y0 = img.height-1
            }
            let l = Math.sqrt(img.width*img.width+img.height*img.height)>>0
            newWidth = l //img.width*2
            newHeight = l //img.height*2
        }
        
        let ret = image.create(newWidth, newHeight)

        //console.log([ret.width, ret.height])
        //新算旧
        _x = (x: number, y: number)=>{
            return (x - x0)*cosa - (y - y0)*sina + x0
        }
        _y = (x: number, y: number)=>{
            return (x - x0)*sina + (y - y0)*cosa + y0
        }
        let x: number
        let y: number
        for(let i = 0; i < newWidth; ++i){
            for(let j = 0; j < newHeight; ++j){
               x = _x(i, j)
               y = _y(i, j)
               if(x>=0 && x<img.width && y>=0 && y<img.height){
                   ret.setPixel(i, j, img.getPixel(x, y))
               }
            }
        }
        return ret
    }

    //------------ 动画 ------------
    export class projectileAnimation{
        anim: Image[]
        next: string
        interval: number
        lifespan: number
        
        constructor(anim: Image[], interval: number = 100, next: string = null){
            this.anim = anim
            this.interval = interval
            this.lifespan = anim.length*interval
            this.next = next
        }
    }

    export let animations: { [key: string]: projectileAnimation; } = {}

    //%block
    //%group="自定义动画"
    //%blockNamespace=动画 
    //%blockId=defAnimation block="自定义动画集合"
    //%weight=100
    //%afterOnStart=true
    export function defAnimation(f: ()=>void){
        f()
    }

    //%block
    //%group="自定义动画"
    //%blockNamespace=动画 
    //%blockId=setAnimation block="自定义动画 %anim=animation_editor 命名为%name|| 每帧间隔%interval ms 下一动画%next"
    //%weight=99
    //%interval.defl=100 
    //%inlineInputMode=inline
    export function setAnimation(anim: Image[], name: string, interval: number = 100, next: string = null){
        if(animations[name] != undefined){
            console.log("定义动画时发生命名冲突："+name)
            return
        }
        let animation = new projectileAnimation(anim, interval, next)
        animations[name] = animation
    }

    //%block
    //%group="自定义动画"
    //%blockNamespace=动画 
    //%blockId=runAnimation block="%sprite=variables_get(projectile) 播放动画 %name|| 跟随%follow=toggleOnOff 循环播放%loop=toggleOnOff"
    //%weight=98
    //%inlineInputMode=inline
    export function runAnimation(sprite: Sprite, name: string, follow = false, loop = false){
        let tsprite = _runAnimation(name, loop)
        if(tsprite == null){
            return
        }
        tsprite.setPosition(sprite.x, sprite.y)
        if(follow){
            let clock: number
            clock = setInterval(()=>{
                if(!(sprite.flags & sprites.Flag.Destroyed)){
                    tsprite.destroy()
                    clearInterval(clock)
                    clock = -1
                }
                else{
                    tsprite.setPosition(sprite.x, sprite.y)
                }
            }, 0)
            if(!loop){
                setTimeout(()=>{
                    clearInterval(clock)
                    clock = -1
                }, animations[name].lifespan)
            }
        }
    }

    //%block
    //%group="自定义动画"
    //%blockNamespace=动画 
    //%blockId=runAnimationAt block="播放动画 %name 在x%x y%y|| 循环播放%loop=toggleOnOff"
    //%weight=97
    //%inlineInputMode=inline
    export function runAnimationAt(name: string, x: number, y: number, loop = false){
        let tsprite = _runAnimation(name, loop)
        if(tsprite == null){
            return
        }
        tsprite.setPosition(x, y)
    }

    function _runAnimation(name: string, loop: boolean = false){
        let a = animations[name]
        if(a == undefined){
            console.log("动画 '"+name+"' 未定义!")
            return null
        }
        if(a.anim.length == 0){
            console.log("动画 '"+name+"' 为空!")
            return null
        }
        let tsprite = sprites.create(a.anim[0])
        tsprite.setFlag(SpriteFlag.Ghost, true)
        animation.runImageAnimation(tsprite, a.anim, a.interval, loop)
        if(!loop){
            tsprite.lifespan = a.lifespan
            if(a.next != null){
                setTimeout(()=>{
                    runAnimationAt(a.next, tsprite.x, tsprite.y, false)
                }, a.lifespan)
            }
        }
        return tsprite
    }

}
