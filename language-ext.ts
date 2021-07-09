namespace Helper{
    //------------ 临时变量 ------------
    export class tempVarDic{
        map: { [key: string]: number; }
        constructor(){
            this.map = {}
        }
    }

    export function getVal(tempVar: tempVarDic, key: string){
        if(tempVar.map[key] == undefined){
            console.log("临时变量 '"+key+"' 未定义！")
        }
        return tempVar.map[key]
    }

    export function add(tempVar: tempVarDic, key: string, val: number){
        tempVar.map[key] = val
    }

    export function updateVar(val: number, tempVar: tempVarDic, key: string, ){
        tempVar.map[key] += val
    }

    //------------ promise ------------
    interface TimeAction {
        delay:number,
        callback: ((sprite: Sprite) =>void)
    }

    export class Request {
        callbacks : TimeAction[] ;
        sprite: Sprite;
        constructor(sprite: Sprite) {
            this.sprite = sprite
            this.callbacks = []
        }

        pushCb(delay:number, cb : (sprite: Sprite) =>void) {
            this.callbacks.push({delay:delay, callback:cb})
        }

        pop() : TimeAction {
            return this.callbacks.removeAt(0)
        }

        isEmpty () :boolean {
            return this.callbacks.length == 0
        }
    }

    //Sprite->Player\Enemy\wave
    export function then(delay:number, cb:(sprite: Sprite) => void ) {
        currentRequest.pushCb(delay*1000, cb)
    }

    export function invoke() {
        const _currentRequest = currentRequest
        control.runInParallel(() => {
            while (!_currentRequest.isEmpty()) {
                let timeAction = _currentRequest.pop()
                pause(timeAction.delay)
                timeAction.callback(_currentRequest.sprite)
            }
        })
    }

    export let currentRequest:Request = null;
    //------------- setTimeout -------------
    //% block="延迟 $time 秒后执行"
    //% time.defl=0.5
    //%blockNamespace=弹射物
    //%group="动作"
    //%handlerStatement=1
    //%time=timePicker ms"
    //%weight=10
    export function after(time: number, thenDo: () => void) {
        setTimeout(thenDo, time*1000)
    }

    //------------- 一些数值的计算 -------------
    //s1指向s2的方向
    export function compAngle(s1: Sprite, s2: Sprite){
        return Math.atan2(s2.y-s1.y, s2.x-s1.x)
    }
    //s的速率
    export function compSpeed(s: Sprite){
        return Math.sqrt(s.vx*s.vx+s.vy*s.vy)
    }
    //s1到s2的距离
    export function distance(s1: Sprite, s2: Sprite){
        return distance_p(s1.x, s1.y, s2.x, s2.y)
    }
    //xy1到xy2的距离
    export function distance_p(x: number, y: number, x2: number, y2: number){
        return Math.sqrt((y-y2)*(y-y2)+(x-x2)*(x-x2))
    }

    //------------- tostring -------------
    export function tostring(i: number){
        return ""+i
    }
    
    //------------- 优先队列 -------------
    //默认小顶堆
    export class priority_queue<T>{
        tree: T[] = []
        cmp: (a: T, b: T)=>boolean
        constructor(f: (a: T, b: T)=>boolean = null){
            this.tree = []
            this.cmp = f == null ? (a: T, b: T)=>a<b : f
        }
        empty(){
            return this.tree.length == 0
        }
        front(){
            return this.tree[0]
        }
        push(v: T){
            this.tree.push(v)
            this.up()
        }
        pop(){
            this.swap(0, this.tree.length-1)
            this.tree.removeAt(this.tree.length-1)
            this.down()
        }
        private up(){
            let a = this.tree
            let cmp = this.cmp
            let i = a.length-1
            while(i != 0){
                let p = ((i-1)/2)>>0
                if(cmp(a[i], a[p])){
                    this.swap(i, p)
                    i = p
                }
                else{
                    break
                }
            }
        }
        private lastLeaf(){
            return (this.tree.length/2)>>0
        }
        private down(){
            let a = this.tree
            let cmp = this.cmp
            let i = 0
            let lastLeaf = this.lastLeaf()
            while(i < lastLeaf){
                let mnSon = 2*i+1
                if(mnSon+1 < a.length && cmp(a[mnSon+1], a[mnSon])){
                    mnSon++
                }
                if(cmp(a[mnSon], a[i])){
                    this.swap(mnSon, i)
                    i = mnSon
                }
                else{
                    break
                }
            }
        }
        private swap(i: number, j: number){
            if(i != j){
                let t: T = this.tree[i]
                this.tree[i] = this.tree[j]
                this.tree[j] = t
            }

        }
    }
}