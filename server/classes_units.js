const IMG = {}
// IMG.bullet = new Image()
// IMG.bullet.src = 'static/img/bullet.png'
// IMG.player = new Image()
// IMG.player.src = 'static/img/player_sprite sheet.png'
// IMG.map = new Image()
// IMG.map.src = 'static/img/map2.png'
// IMG.enemyBat = new Image()
// IMG.enemyBat.src = 'static/img/bat_sprite sheet.png'
// IMG.enemyBee = new Image()
// IMG.enemyBee.src = 'static/img/bee_sprite sheet.png'

// the map's dimensions
const GAME_WIDTH = 1200
const GAME_HEIGHT = 900

const TIME_INTERVAL = 1000/25

class Map{
    constructor(canvasWidth, canvasHeight, image) {
        this.image = image
        this.canvasWidth = canvasWidth
        this.canvasHeight = canvasHeight
        this.x = 0
        this.y = 0
        this.width = GAME_WIDTH
        this.height = GAME_HEIGHT
    }

    // get
    getXPosition = ()=>this.x
    getYPosition = ()=>this.y

    // set
    setPosition(x, y){
        this.x = x
        this.y = y
    }

    draw(context, player){
        context.save();

        this.x = this.canvasWidth/2 - player.getXPosition()
        this.y = this.canvasHeight/2 - player.getYPosition()
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        

        context.restore();
    }
}

class Unit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight){
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = 'grey'
        this.image = undefined
        this.name = Math.floor(Math.random()*1000)
        this.canvasWidth = canvasWidth
        this.canvasHeight = canvasHeight
        this.gameWidth = GAME_WIDTH
        this.gameHeight = GAME_HEIGHT
        this.id = undefined
        this.mapNumber = undefined

        this.animationSpeed = 6
        this.animationCounter = 0
        this.animationMaxCounter = 3
        this.isAnimationRefresh = true
    }

    getXPosition = ()=>this.x
    getYPosition = ()=>this.y
    getPosition(){
        return {
            'x': this.x,
            'y': this.y
        }
    }
    getWidth(){
        return this.width
    }
    getHeight(){
        return this.height
    }
    getId = ()=>this.id
    getAnimationCounter = ()=>this.animationCounter
    getAnimationSpeed = ()=>this.animationSpeed
    getAnimationMaxCounter = ()=>this.animationMaxCounter
    getMapNumber = ()=>this.mapNumber
    getCanvasWidth = ()=>this.canvasWidth
    getCanvasHeight = ()=>this.canvasHeight

    // set 
    setPosition(x, y){
        const smallestX = this.width/2
        const biggestX = this.gameWidth-this.width/2
        const smallestY = this.height/2
        const biggestY = this.gameHeight-this.height/2
        if(x < smallestX){
            x = smallestX
        }
        else if(x > biggestX){
            x = biggestX
        }
        if(y < smallestY){
            y = smallestY
        }
        else if(y > biggestY){
            y = biggestY
        }

        this.x = x
        this.y = y
    }
    setColor = color=>this.color = color
    setImage = image=>this.image = image
    setId = id=>this.id = id
    setMapNumber = number=>this.mapNumber=number

    draw(context, player){
        // draws the unit on the canvas
        context.save()

        const x = this.x - player.getXPosition() + this.canvasWidth/2 - this.width/2
        const y = this.y - player.getYPosition() + this.canvasHeight/2 - this.height/2
        context.drawImage(this.image, x, y, this.width, this.height);

        context.restore()
    }

    isColliding(unit){
        const x = unit.getXPosition()
        const y = unit.getYPosition()
        return (this.x <= x+unit.getWidth()
        && this.y <= y+unit.getHeight()
        && x <= this.x+this.width
        && y <= this.y+this.height)
    }

    isOutOfBounds(){
        if(this.x < 0 || this.x > this.gameWidth || this.y < 0 || this.y > this.gameHeight){
            return true
        }
        else{
            return false
        }
    }

    updateAnimationCounter(){
        if(this.isAnimationRefresh){
            this.isAnimationRefresh = false
            setTimeout(() => {
                this.isAnimationRefresh = true
            }, 1000/this.animationSpeed);

            if(this.animationCounter === this.animationMaxCounter-1){
                this.animationCounter = 0
            }
            else{
                this.animationCounter++
            }
        }
    }
}

class Upgrade extends Unit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight, type='score') {
        super(x,y,width,height, canvasWidth, canvasHeight)
        this.type = type
        this.color = 'orange'
        this.scoreBonus = 0
        this.ASBonus = 0

        switch (this.type) {
            case 'score':
                this.scoreBonus = 500
                break;
            case 'AS':
                this.ASBonus = .5
                this.color = 'purple'
                break;
        }
    }

    // get
    getLives = ()=>this.lives
    getScoreBonus = ()=>this.scoreBonus
    getType = ()=>this.type
    getASBonus = ()=>this.ASBonus

    draw(context, player){
        // draws the unit on the canvas
        context.save()

        context.fillStyle=this.color;
        const x = this.x - player.getXPosition() + this.canvasWidth/2 - this.width/2
        const y = this.y - player.getYPosition() + this.canvasHeight/2 - this.height/2
        context.fillRect(x, y, this.width, this.height);

        context.restore()
    }

    playerCollision(player){
        if(this.type === 'AS'){
            player.setAS(player.getAS()+this.ASBonus)
        }
    }
}

class MovingUnit extends Unit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight, xSpeed=30, ySpeed=30) {
        super(x, y, width, height, canvasWidth, canvasHeight)
        this.xSpeed = xSpeed
        this.ySpeed = ySpeed
    }

    // get
    getXSpeed = ()=>this.xSpeed
    getYSpeed = ()=>this.ySpeed

    // set
    setXSpeed = xSpeed=>this.xSpeed = xSpeed
    setYSpeed = ySpeed=>this.ySpeed = ySpeed


    calculateSpeedByAngle(angle, totalSpeed){
        const xSpeed = totalSpeed*Math.cos(angle) 
        const ySpeed = totalSpeed*Math.sin(angle)
        return [xSpeed, ySpeed]
    }

    move(){
        this.x += this.xSpeed*TIME_INTERVAL/1000
        this.y += this.ySpeed*TIME_INTERVAL/1000
    }

}

class Player extends MovingUnit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight, xSpeed=30, ySpeed=30) {
        super(x, y, width, height, canvasWidth, canvasHeight, xSpeed, ySpeed)
        this.image = IMG.player
        this.lives = 5
        this.maxLives = 5
        this.AS = 1
        this.isLeftAttackReady = true
        this.isRightAttackReady = true
        this.direction = {
            'x': 0,
            'y': 0
        }
        this.clicks = {
            'left': false,
            'right': false
        }
        this.mouseX = 0
        this.mouseY = 0
        this.animationSpeed = 6
        this.animationMaxCounter = 8
        this.spriteWidth = 130
        this.spriteHeight = 128.75
        this.canvasStyleWidth = 0
        this.canvasStyleHeight = 0
        this.score = 0
        this.inventory = {}
    }
    // get
    getLives = ()=>this.lives
    getMaxLives = ()=>this.maxLives
    getAS = ()=>this.AS
    getDirection = ()=>this.direction
    getMousePosition = ()=>[this.mouseX, this.mouseY]
    getScore = ()=>this.score
    getInventory = ()=>this.inventory
    getItem = id=>this.inventory[id]

    // set 
    setLives = lives=>lives>=0 ? this.lives=lives : null
    setAS = AS=>this.AS = AS
    setMousePosition(x,y){
        this.mouseX = x
        this.mouseY = y
    }
    setCanvasStyle(width, height){
        this.canvasStyleWidth = width
        this.canvasStyleHeight = height
    }
    setDirection = (x,y)=>{
        this.direction = {x,y}
    }
    setScore = score=>this.score = score

    addItems = function(items){
        for(let item of items){
            const thisItem = this.inventory[item.getId()]
            if(thisItem){
                thisItem.setQuantity(this.item.getQuantity()+1)
            }
            else{
                this.inventory[item.getId()] = item
            }
        }
    }
    deleteItem = function(id){
        delete this.inventory[id]
    }

    removeItem = function(id, quantity){
        const item = this.inventory[id]
        item.setQuantity(item.getQuantity()-quantity)
        if(item.getQuantity() <= 0){
            delete this.inventory[id]
        }
    }

    useItem = function(id){
        if(this.inventory[id] && this.inventory[id].getQuantity() > 0){
            return this.inventory[id].getCb()()
        }
        else{
            console.log('item does not exist or is empty');
            return 0
        }            
    }

    move(){
        const xSpeed = this.xSpeed*(TIME_INTERVAL/1000)*this.direction.x
        const ySpeed = this.ySpeed*(TIME_INTERVAL/1000)*this.direction.y
        this.setPosition(this.x+xSpeed, this.y+ySpeed)
    }

    draw(context, player){
        context.save();
        
        const spriteX = this.animationCounter*this.spriteWidth
        let spriteY = 0
        if(this.direction.y === -1){
            spriteY = this.spriteHeight
        }
        else if(this.direction.x === 1){
            spriteY = 0
        }
        else if(this.direction.y === 1){
            spriteY = 4*this.spriteHeight
        }
        else if(this.direction.x === -1){
            spriteY = 7*this.spriteHeight
        }
        const x = this.x - player.getXPosition() + this.canvasWidth/2 - this.width/2
        const y = this.y - player.getYPosition() + this.canvasHeight/2 - this.height/2

        context.drawImage(this.image, spriteX, spriteY, this.spriteWidth, 
            this.spriteHeight, x, y, this.width, this.height);
        
        this.updateAnimationCounter()

        context.restore();


        context.save();

        const hpBarWidth = this.width*1.5
        context.fillStyle='green';
        context.fillRect(x-hpBarWidth/2+this.width/2, y-20, hpBarWidth*this.lives/this.maxLives, 10);
        context.strokeStyle='black';
        context.lineWidth=1;
        context.strokeRect(x-hpBarWidth/2+this.width/2, y-20,hpBarWidth, 10);

        context.restore();

    }

    WASDPress(key, bool){
        switch (key) {
            case 'w':
                this.direction.y = bool ? -1:0
                break;
            case 'd':
                this.direction.x = bool ? 1:0
                break;
            case 's':
                this.direction.y = bool ? 1:0
                break;
            case 'a':
                this.direction.x = bool ? -1:0
                break;
        }

    }

    // assignToWASD(){
    //     document.onkeydown = e=>{
    //         switch (e.key) {
    //             case 'w':
    //                 this.direction.y = -1
    //                 break;
    //             case 'd':
    //                 this.direction.x = 1
    //                 break;
    //             case 's':
    //                 this.direction.y = 1
    //                 break;
    //             case 'a':
    //                 this.direction.x = -1
    //                 break;
    //         }
    //     }

    //     document.onkeyup = e=>{
    //         switch (e.key) {
    //             case 'w':
    //                 this.direction.y = 0
    //                 break;
    //             case 'd':
    //                 this.direction.x = 0
    //                 break;
    //             case 's':
    //                 this.direction.y = 0
    //                 break;
    //             case 'a':
    //                 this.direction.x = 0
    //                 break;
    //         }

    //     }
    // }

    mouseActions(button, isDown){
        if(button === 0){
            this.clicks.left = Boolean(isDown)
        }
        else if(button === 2){
            this.clicks.right = Boolean(isDown)
        }
    }

    // just use setMousePosition() 
    mouseMove(offsetX, offsetY){
        this.setMousePosition(offsetX, offsetY)
    }

    // assignToClicks(){
    //     document.onmousedown = e=>{
    //         if(e.button === 0){
    //             this.clicks.left = true
    //         }
    //         else if(e.button === 2){
    //             this.clicks.right = true
    //         }
    //     }
    //     document.onmouseup = e=>{
    //         if(e.button === 0){
    //             this.clicks.left = false
    //         }
    //         else if(e.button === 2){
    //             this.clicks.right = false
    //         }
    //     }
    //     document.onmousemove = e=>{
    //         this.setMousePosition(e.offsetX, e.offsetY)
    //     }
    // }

    leftShot(){
        if(this.isLeftAttackReady){
            const width = 15
            const height = 15

            const angle = Math.atan2((this.mouseY-this.canvasStyleHeight/2), (this.mouseX-this.canvasStyleWidth/2))
            const totalSpeed = 150
            const [xSpeed, ySpeed] = this.calculateSpeedByAngle(angle, totalSpeed)

            this.isLeftAttackReady = false
            setTimeout(() => {
                this.isLeftAttackReady = true
            }, 1000/this.AS);
            
            const bullet = new Bullet(this.x,this.y,width,height,this.canvasWidth,this.canvasHeight,xSpeed,ySpeed)
            bullet.setId(Math.random())
            bullet.setMapNumber(this.mapNumber)
            bullet.setOwner(this)
            return bullet
        }
    }

    rightShot(){
        if(this.isRightAttackReady){
            const width = 15
            const height = 15

            const bullets = {}
            for(let i = 0; i<2*Math.PI; i+=.2){
                const angle = i
                const totalSpeed = 60
                const [xSpeed, ySpeed] = this.calculateSpeedByAngle(angle, totalSpeed)
                const bullet = new Bullet(this.x,this.y,width,height,this.canvasWidth, this.canvasHeight,xSpeed,ySpeed)
                bullet.setId(Math.random())
                bullet.setMapNumber(this.mapNumber)
                bullet.setOwner(this)
                bullets[bullet.id] = bullet
            }

            this.isRightAttackReady = false
            setTimeout(() => {
                this.isRightAttackReady = true
            }, 1000/this.AS);

            return bullets
        }
    }

    shoot(){
        const bullets = {}
        if(this.clicks.left){
            const bullet = this.leftShot()
            if(bullet){
                bullets[bullet.id] = bullet
            }
        }
        if(this.clicks.right){
            const dict = this.rightShot()
            if(dict){
                // bullets.push(...list)
                Object.assign(bullets, dict)
            }
        }
        return bullets
    }

    respawn(){
        this.x = Math.floor(Math.random()*this.canvasWidth)
        this.y = Math.floor(Math.random()*this.canvasHeight)
        this.lives = this.maxLives
    }
}

class BouncingUnit extends MovingUnit{
    move(){
        if(this.x < 0 || this.x > GAME_WIDTH){
            this.xSpeed = -this.xSpeed
        }
        if(this.y < 0 || this.y > GAME_HEIGHT){
            this.ySpeed = -this.ySpeed
        }
        super.move()
    }
}

class Bullet extends BouncingUnit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight, xSpeed=30, ySpeed=30) {
        super(x, y, width, height, canvasWidth, canvasHeight, xSpeed, ySpeed)
        this.image = IMG.bullet
        this.collidedEnemies = {}
        this.owner = undefined
    }

    // get
    getOwner = ()=>this.owner

    // set 
    setOwner(owner){
        if(!(owner instanceof Unit)){
            throw 'bullet owner is not a Unit'
        }
        this.owner = owner
    }

    enemyCollision(enemy){
        if(enemy.id in this.collidedEnemies){
            return false
        }
        this.collidedEnemies[enemy.id] = true
        enemy.setLives(enemy.getLives()-1)
        if(enemy.getLives() === 0){
            return true
        }
        else{
            return false
        }
    }

    playerCollision(player){
        if(player !== this.owner){
            player.setLives(player.getLives()-1)
            return true
        }
    }
}

class Enemy extends BouncingUnit{
    constructor(x=50, y=50, width=20, height=20, canvasWidth, canvasHeight, totalSpeed, type) {
        const angle = Math.random()*2*Math.PI
        const xSpeed = totalSpeed*Math.cos(angle) 
        const ySpeed = totalSpeed*Math.sin(angle)
        super(x, y, width, height, canvasWidth, canvasHeight, xSpeed, ySpeed)
        this.totalSpeed = totalSpeed
        this.isAttackReady = true
        this.id = Math.random()

        if(type === 'bat'){
            this.image = IMG.enemyBat
            this.AS = .5
            this.lives = 2
            this.maxLives = this.lives
            this.animationMaxCounter = 3
            this.spriteWidth = 48
            this.spriteHeight = 64
            this.type = 'bat'
        }
        else if(type === 'bee'){
            this.image = IMG.enemyBee
            this.AS = 1
            this.lives = 1
            this.maxLives = this.lives
            this.animationMaxCounter = 5
            this.spriteWidth = 274
            this.spriteHeight = 152.4
            this.type = 'bee'
        }
        else{
            throw 'Enemy class does not have proper type'
        }
    }

    // get
    getLives = ()=>this.lives

    // set
    setLives = lives=>this.lives = lives

    // playerCollision(player){
    //     player.setLives(player.getLives()-1)
    // }

    shoot(player){
        if(!this.isAttackReady){
            return
        }

        // bullet dimensions
        const width = 15
        const height = 15

        const xDistance = player.getXPosition()-this.x
        const yDistance = player.getYPosition()-this.y
        const angle = Math.atan2(yDistance, xDistance)
        const [xSpeed, ySpeed] = this.calculateSpeedByAngle(angle, this.totalSpeed*1.5)
        const bullet = new Bullet(this.x, this.y, width, height, this.canvasWidth, 
            this.canvasHeight, xSpeed, ySpeed)

        this.isAttackReady = false
        setTimeout(() => {
            this.isAttackReady = true
        }, 1000/this.AS);

        return bullet
    }

    move(player){
        const xDistance = player.getXPosition()-this.x
        const yDistance = player.getYPosition()-this.y
        const angle = Math.atan2(yDistance, xDistance)
        const speed = this.calculateSpeedByAngle(angle, this.totalSpeed)
        this.xSpeed = speed[0]
        this.ySpeed = speed[1]

        super.move()
    }

    draw(context, player){
        context.save()

        // unit
        let spriteX = 0
        let spriteY = 0
        if(this.type === 'bat'){
            spriteX = this.animationCounter*this.spriteWidth
            spriteY = 0
        }
        else if(this.type === 'bee'){
            spriteX = 0
            spriteY = this.animationCounter*this.spriteHeight
        }
        this.updateAnimationCounter()


        const x = this.x - player.getXPosition() + this.canvasWidth/2 - this.width/2
        const y = this.y - player.getYPosition() + this.canvasHeight/2 - this.height/2
        context.drawImage(this.image, spriteX, spriteY, this.spriteWidth, 
            this.spriteHeight, x, y, this.width, this.height);
        
        context.restore();
        context.save();

        // hp bar
        const hpBarWidth = this.width*1.5
        context.fillStyle='green';
        context.fillRect(x-hpBarWidth/2+this.width/2, y-20, hpBarWidth*this.lives/this.maxLives, 10);
        context.strokeStyle='black';
        context.lineWidth=1;
        context.strokeRect(x-hpBarWidth/2+this.width/2, y-20,hpBarWidth, 10);
        
        context.restore()
    }
}


class Item{
    constructor(id, name, cb) {
        this.id = id
        this.name = name
        this.cb = cb
        this.quantity = 1
    }

    getId = ()=>this.id
    getName = ()=>this.name
    getCb = ()=>this.cb
    getQuantity = ()=>this.quantity

    setQuantity(quantity){
        if(this.quantity > 0){
            this.quantity = quantity
        }
    }
}

module.exports = {Unit, Player, Enemy, Bullet, Map, Item}