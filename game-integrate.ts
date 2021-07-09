namespace IntegrateGame{
    //玩家,敌人,武器
    export let defExtSprite: {[key: string]: Helper.mySprite; }[] = [{}, {}, {}]
    // setTimeout(()=>{
    //     for(let x of defExtSprite){
    //         for(let key of Object.keys(x)){
    //             console.log(key)
    //         }
    //     }
    // }, 0)

    //迷宫
    export let mazeList: {[key: string]: Maze.maze} = {}

    // setTimeout(()=>{
    //     for(let key of Object.keys(mazeList)){
    //         console.log(key)
    //     }
    // }, 0)

    export function getIntegrateSprite(){

    }
}