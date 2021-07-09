namespace myGame{
    //------------- 碰撞判定 -------------
    export function bulletANDsprite(bulletKind: number, spriteKind: number){
        sprites.onOverlap(bulletKind, spriteKind, function(b: Bullet.wave, e: Character.Character) {
            if(b.interval != -1){
                return
            }
            Bullet.perish(b, e, 2, 0)
            hurt(e, b.damage, b.hitrec)
            if(b.backoff != 0){
                reverseMove(e, b, b.backoff, b.hitrec)
            }
        })
        sprites.onDestroyed(bulletKind, function(b: Bullet.wave) {
            if(b.blastAnim != undefined && b.blastAnim != null){
                Helper.runAnimation(b, b.blastAnim)
            }
        })
    }

    sprites.onOverlap(SpriteKind.PlayerBullet, SpriteKind.EnemyBullet, function(b: Bullet.wave, e: Bullet.wave) {
        if(b.indeflectible == false 
            && b.rebound == false && e.rebound == true){
            b.setKind(e.kind())
            Bullet.changeDir(b, e, -1)
        }
        else if(e.indeflectible == false
            && e.rebound == false && b.rebound == true){
            e.setKind(b.kind())
            Bullet.changeDir(e, b, -1)
        }
        else{
            Bullet.perish(b, e, 1, e.perishTogether)
            Bullet.perish(e, e, 1, b.perishTogether)
        }
    })

    sprites.onOverlap(SpriteKind.PlayerWeapon, SpriteKind.EnemyBullet, function(b: Weapon.Weapon, e: Bullet.wave) {
        if(b.attack == 0){
            return
        }
        if(e.indeflectible == false
            && e.rebound == false && b.damage >= e.damage*2){
            e.setKind(b.kind())
            Bullet.changeDir(e, b, -1)
        }
        else{
            Bullet.perish(e, b, 3, b.damage)
        }
    })

    bulletANDsprite(SpriteKind.PlayerBullet, SpriteKind.Enemy)
    bulletANDsprite(SpriteKind.PlayerBullet, SpriteKind.BOSS)
    bulletANDsprite(SpriteKind.EnemyBullet, SpriteKind.PlayerServant)
    bulletANDsprite(SpriteKind.EnemyBullet, SpriteKind.Player)

    function weaponANDenemy(enemyKind: number){
        sprites.onOverlap(SpriteKind.PlayerWeapon, enemyKind, function(w: Weapon.Weapon, e: Enemy.Enemy) {
            if(w.attack > 0){
                hurt(e, w.damage*0.2, w.hitrec)
                if(w.backoff != 0){
                    reverseMove(e, w, w.backoff, w.hitrec/1000)
                }
            }
        })
    }
    weaponANDenemy(SpriteKind.Enemy)
    weaponANDenemy(SpriteKind.BOSS)

    //------------- 伤害 -------------
    const bossMaxDamage = 20 //BOSS受到的最大伤害
    export function hurt(e: Character.Character, damage: number, time: number){
        damage = e.def*damage
        if(e.kind() == SpriteKind.BOSS){
            damage = Math.min(damage, bossMaxDamage)
        }
        e.hpbar.value -= damage
        if(e.hpbar.value <= 0){
            e.destroy()
            return
        }
        let moveto = (<Enemy.Enemy>e).moveto
        if(moveto != undefined){
            Enemy.stopMove(<Enemy.Enemy>e)
        }
        e.attack = 0
        clearTimeout(e.hitrecclock)
        e.hitrecclock = setTimeout(()=>{
            e.hitrecclock = -1
            e.hurted = 0
            if(moveto != undefined){
                (<Enemy.Enemy>e).moveto = moveto
                Enemy.enemyMoveTo(<Enemy.Enemy>e, moveto[0], moveto[1], moveto[2])
            }
        }, time)
        while(e.attachBullet.length > 0){
            let b = e.attachBullet.removeAt(0)
            b.destroy()
        }
    }
    //------------- 移动 -------------
    export function reverseMove(e: Sprite, os: Sprite, n: number, time: number){
        let angle = Math.atan2(e.y-os.y, e.x-os.x)
        let x = n*Math.cos(angle)
        let y = n*Math.sin(angle)
        Bullet.movexy(e, time/1000, x, y)
    }

    //------------- 玩家被打败 -------------
    sprites.onDestroyed(SpriteKind.Player, function(sprite: Sprite) {
        if(sprite == Player.getPlayer()){
            Maze.clearSprite(SpriteKind.PlayerServant)
            Maze.clearSprite(SpriteKind.PlayerWeapon)
            for(let sprite of sprites.allOfKind(SpriteKind.Enemy)){
                sprite.flags |= sprites.Flag.Destroyed;
            }
            Maze.stopCreateMonster()
            game.over()
        }
    })
}