// refresh time interval in ms
const TIME_INTERVAL = 16.67
const UPGRADE_INTERVAL = 5000
const ENEMY_INTERVAL = 4000
const BULLET_INTERVAL = 1000
const BULLET_LIFETIME = 2000
const SCORE_INTERVAL = 100
IMG.map = new Image()
IMG.map.src = 'img/map3.png'


document.addEventListener('DOMContentLoaded', function(){
    const canvas1 = document.querySelector('#canvas1')
    document.oncontextmenu = e=>e.preventDefault()
    
    let score = {'score': 0}
    const map = new Map(canvas1.width, canvas1.height, IMG.map)
    // units
    const player = new Player(30, 30, 90, 90, canvas1.width, canvas1.height, 120, 120)
    player.assignToWASD()
    player.assignToClicks()
    const enemyList = []
    for(let i = 0; i<3; i++){
        enemyList.push(generateEnemy(canvas1))
    }
    const upgradeList = []
    const bulletList = []
    const enemyBulletList = []

    // window
    windowResize(player)
    window.onresize = ()=>windowResize(player)
    // inventory
    const inventory = {}
    createPlayerInventory(inventory, canvas1, player, enemyList)
    

    // moving units and collisions and repainting canvas
    setInterval(function(){
        // move units
        player.move()
        for(enemy of enemyList){
            enemy.move(player)
        }
        for(bullet of bulletList){
            bullet.move()
        }
        for(bullet of enemyBulletList){
            bullet.move()
        }

        // bullet shots
        enemyShots(enemyBulletList, enemyList, player)
        playerShots(bulletList, player, canvas1)
        
        playerCollisions(score, player, enemyBulletList, upgradeList)
        bulletCollisions(bulletList, enemyList)

        // draw canvas
        const context = canvas1.getContext('2d')
        context.clearRect(0, 0, canvas1.width, canvas1.height);

        map.draw(canvas1, player)
        player.draw(canvas1, player)
        for(enemy of enemyList){
            enemy.draw(canvas1, player)
        }
        for(upgrade of upgradeList){
            upgrade.draw(canvas1, player)
        }
        for(bullet of bulletList){
            bullet.draw(canvas1, player)
        }
        for(bullet of enemyBulletList){
            bullet.draw(canvas1, player)
        }
        writeText(canvas1, player, score)

        if(player.getLives() === 0){
            resetGame(enemyList, upgradeList, bulletList, enemyBulletList)
            player.setLives(player.getMaxLives())
        }
    }, TIME_INTERVAL);

    // generate enemies
    setInterval(() => {
        enemyList.push(generateEnemy(canvas1))
    }, ENEMY_INTERVAL);

    // generate upgrades
    setInterval(() => {
        upgradeList.push(generateUpgrade(canvas1))
    }, UPGRADE_INTERVAL);

    // calculate score
    setInterval(() => {
        score.score++
    }, SCORE_INTERVAL);

})


function bulletCollisions(bulletList, enemyList){
    bulletList.forEach((bullet)=>enemyList.some(function(enemy, enemyIndex){
        if(bullet.isColliding(enemy)){
            if(bullet.enemyCollision(enemy)){
                enemyList.splice(enemyIndex, 1)
            }
            return true
        }
    }))
}

function writeText(canvas, player, score){
    const context = canvas.getContext('2d')
    context.save();

    context.font='30px sans-serif';
    context.textBaseline='top';
    context.fillText(player.getLives(), 10, 10);
    context.textAlign='right';
    context.fillText(score.score, canvas.width-10, 10);

    context.restore();
}

function generateEnemy(canvas){
    const x = Math.floor(Math.random()*GAME_WIDTH)
    const y = Math.floor(Math.random()*GAME_HEIGHT)
    const width = 64
    const height = 64
    const totalSpeed = 80
    let type = undefined
    if(Math.random() < 0.5){
        type = 'bee'
    }
    else{
        type = 'bat'
    }
    const enemy = new Enemy(x,y,width,height,canvas.width,canvas.height,totalSpeed, type)
    return enemy
}

function generateUpgrade(canvas){
    const x = Math.floor(Math.random()*GAME_WIDTH)
    const y = Math.floor(Math.random()*GAME_HEIGHT)
    const width = 20
    const height = 20
    const type = Math.random()<.5 ? 'score' : 'AS'
    const upgrade = new Upgrade(x,y,width,height,canvas.width,canvas.height,type)
    return upgrade
}

function playerShots(bulletList, player, canvas){
    const list = player.shoot(canvas)
    if(list && list.length){
        bulletList.push(...list)            
        setTimeout(() => {
            bulletList.splice(0, list.length)
        }, BULLET_LIFETIME);
    }
}

function enemyShots(bulletList, enemyList, player){
    for(enemy of enemyList){
        const bullet = enemy.shoot(player)
        if(bullet){
            bulletList.push(bullet)
            setTimeout(() => {
                bulletList.shift()
            }, BULLET_LIFETIME);
        }
    }
}

function playerCollisions(score, player, enemyBulletList, upgradeList){
    // deducts a life from player everytime it collides with an enemy
    // for(enemy of enemyList){
    //     if(player.isColliding(enemy)){
    //         enemy.playerCollision(player)
    //     }
    // }
    enemyBulletList.forEach(function(bullet){
        if(player.isColliding(bullet)){
            bullet.playerCollision(player)
        }
    })

    // upgrades
    for(index in upgradeList){
        const upgrade = upgradeList[index]
        if(player.isColliding(upgrade)){
            upgrade.playerCollision(player)
            score.score += upgrade.getScoreBonus()
            upgradeList.splice(index, 1)

        }
    }
}

function createPlayerInventory(inventory, canvas, player, enemyList){
    const itemList = []
    itemList.push(
        new Item(1, 'potion', function(){
            player.setLives(player.getMaxLives())
            return true
        })
    )
    itemList.push(new Item(2, 'Generate enemy', function(){
        enemyList.push(generateEnemy(canvas))
        return false
    }))

    const div = document.createElement('div')
    for(let item of itemList){
        const button = document.createElement('button')
        button.innerHTML = `${item.getId()} ${item.getName()} x${item.getQuantity()}`
        button.onclick = function(e){
            const quantity = item.getQuantity()
            if(!quantity){
                return
            }
            const isRemove = (item.getCb())()
            if(isRemove){
                item.setQuantity(quantity-1)
                button.innerHTML = `${item.getId()} ${item.getName()} x${item.getQuantity()}`
            }
        }
        // stops player from shooting
        button.onmousedown = e=>e.stopPropagation()
        div.append(button)
    }
    document.querySelector('body').append(div)

        
    for(let item of itemList){
        inventory[item.id] = item
    }

}

function windowResize(player){
    const screenRatio = 14/10
    let width = window.innerWidth
    let height = window.innerHeight
    if(window.innerWidth > height*screenRatio){
        width = height*screenRatio
    }
    else{
        height = width/screenRatio
    }
    player.setCanvasStyle(width, height)

    document.querySelector('#canvas1').style.width = `${width}px`
    document.querySelector('#canvas1').style.height = `${height}px`
}

function resetGame(enemyList, upgradeList, bulletList, enemyBulletList){
    enemyList.splice(0, enemyList.length)
    for(let i = 0; i<3; i++){
        enemyList.push(generateEnemy(canvas1))
    }
    upgradeList.splice(0 , upgradeList.length)
    bulletList.splice(0, bulletList.length)
    enemyBulletList.splice(0 ,enemyBulletList.length)
}
