
localStorage.debug = 'socket.io*'
const socket = io()

const playerDict = {}
const bulletDict = {}
const REFRESH_RATE = 25
let thisPlayer = undefined
let thisMap = undefined


document.addEventListener('DOMContentLoaded', function(){
    const canvas = document.querySelector('#canvas1')
    const context = canvas.getContext('2d')

    setInterval(() => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if(thisMap){
            thisMap.draw(context, thisPlayer)
        }
        drawPlayers(context, playerDict)
        drawBullets(context, bulletDict)
        drawUI()
    }, 1000/REFRESH_RATE);


    document.onkeydown = e=>{
        socket.emit('WASDPress', [e.key, true])
    }

    document.onkeyup = e=>{
        socket.emit('WASDPress', [e.key, false])
    }
    document.querySelector('#canvas1').onmousedown = function(e){
        socket.emit('mouseClick', {
            'button': e.button,
            'isDown': true
        })
    }
    document.querySelector('#canvas1').onmouseup = function(e){
        socket.emit('mouseClick', {
            'button': e.button,
            'isDown': false
        })
    }
    document.querySelector('#canvas1').oncontextmenu = e=>e.preventDefault()
    document.querySelector('#canvas1').onmousemove = function(e){
        socket.emit('mouseMove', {
            'offsetX': e.offsetX,
            'offsetY': e.offsetY
        })
    }
    // playerDict[0.28426512192911635].getMousePosition()
    // chat
    document.querySelector('#chat~form').onsubmit = function(e){
        e.preventDefault()

        const input = document.querySelector('#chat-input')
        const message = input.value
        input.value = null
        socket.emit('addChat', message)
    }

    socket.on('addChat', function(message){
        const p = document.createElement('p')
        p.innerHTML = `${message.id}: ${message.message}`
        document.querySelector('#chat').append(p)
    })


    document.querySelector('#dm~form').onsubmit = function(e){
        e.preventDefault()

        const input = document.querySelector('#dm-input')
        const string = input.value
        if(string[0] !== '@'){
            console.log('dm wrong input');
        }
        const to = string.slice(1, string.indexOf(' '))
        const message = string.slice(string.indexOf(' ')+1)
        input.value = null
        socket.emit('addDM', to, message)
    }

    socket.on('addDM', function(mode, to, message){
        if(mode === 'receive'){
            const p = document.createElement('p')
            p.innerHTML = `From ${to}: ${message}`
            document.querySelector('#dm').append(p)
        }
        else if (mode === 'send'){
            const p = document.createElement('p')
            p.innerHTML = `To ${to}: ${message}`
            document.querySelector('#dm').append(p)
        }
    })

    // debug
    socket.on('eval', data=>console.log(data))

    socket.on('player', function(mode, playerPack){
        if(mode === 'init'){
            for(let key in playerPack){
                if(thisPlayer){
                    if(parseFloat(key) === thisPlayer.getId()){
                        continue
                    }
                }
                const serverPlayer = playerPack[key]
                const player = new Player(serverPlayer.x, serverPlayer.y, serverPlayer.width, serverPlayer.height, serverPlayer.canvasWidth, serverPlayer.canvasHeight, serverPlayer.xSpeed, serverPlayer.ySpeed)
                player.setId(serverPlayer.id)
                player.setMapNumber(serverPlayer.mapNumber)
                player.setCanvasStyle(400, 400)
                playerDict[player.getId()] = player
                // if(thisPlayer){
                //     console.log('this player exists');
                //     console.log(key, thisPlayer.getId());
                //     console.log(typeof(key), typeof(thisPlayer.getId()));
                //     if(key === thisPlayer.getId()){
                //         console.log(playerDict[player.getId()] === thisPlayer);
                //     }
                // }
            }
        }
        else if(mode === 'id'){
            thisPlayer = playerDict[playerPack.id]
            thisMap = new Map(thisPlayer.getCanvasWidth(), thisPlayer.getCanvasHeight(), IMG.maps[thisPlayer.getMapNumber()])
        }
        else if(mode === 'remove'){
            delete playerDict[playerPack.id]
        }
        else if(mode === 'update'){
            // console.log(playerPack);
            for(let key in playerPack){
                const player = playerPack[key]
                playerDict[key].setPosition(player.x, player.y)
                playerDict[key].setDirection(player.direction.x, player.direction.y)
                playerDict[key].setLives(player.lives)
                playerDict[key].setScore(player.score)
                playerDict[key].setMapNumber(player.mapNumber)
            }
        }
    })

    socket.on('bullet', function(mode, bulletPack){
        if(mode === 'init'){
            for(let key in bulletPack){
                const serverBullet = bulletPack[key]
                const bullet = new Bullet(serverBullet.x, serverBullet.y,serverBullet.width,serverBullet.height,serverBullet.canvasWidth, serverBullet.canvasHeight, serverBullet.xSpeed, serverBullet.ySpeed)
                bullet.setMapNumber(serverBullet.mapNumber)
                bulletDict[key] = bullet
            }
        }
        else if(mode === 'remove'){
            delete bulletDict[bulletPack.id]
        }
        else if(mode === 'update'){
            for(let key in bulletPack){
                const serverBullet = bulletPack[key]
                bulletDict[key].setPosition(serverBullet.x, serverBullet.y)
            }
        }
    })

    document.querySelector('#map-change').onclick = function(){
        socket.emit('mapChange', true)
    }

    socket.on('mapChange', function(mapNumber){
        thisPlayer.setMapNumber(mapNumber)
        thisMap = new Map(thisPlayer.getCanvasWidth(), thisPlayer.getCanvasHeight(), IMG.maps[thisPlayer.getMapNumber()])
    })

    socket.on('addItems', function(items){
        const clientItems = []
        for(let item of items){
            const clientItem = new Item(item.id, item.name, item.cb)
            clientItem.setQuantity(item.quantity)
            clientItems.push(clientItem)
        }
        thisPlayer.addItems(clientItems)
        drawInventory()
    })

    socket.on('updateItem', function(mode, id, quantity){
        if(mode === 'update'){
            thisPlayer.getItem(id).setQuantity(quantity)
        }
        else if(mode === 'delete'){
            thisPlayer.deleteItem(id)
        }
        drawInventory()
    })

})


function drawPlayers(context, playerDict){
    for(let key in playerDict){
        const player = playerDict[key]
        if(player.getMapNumber() === thisPlayer.getMapNumber()){
            player.draw(context, thisPlayer)
        }
        // context.fillText('P', player.x, player.y);
    }
}

function drawBullets(context, bulletDict){
    for(let key in bulletDict){
        const bullet = bulletDict[key]
        if(bullet.getMapNumber() === thisPlayer.getMapNumber()){
            bullet.draw(context, thisPlayer)
        }
        // context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawUI(){
    if(!thisPlayer){
        return
    }
    document.querySelector('#score').innerHTML = thisPlayer.getScore()

}

function drawInventory(){
    const inventory = thisPlayer.getInventory()
    if(document.querySelector('#inventory>div')){
        document.querySelector('#inventory>div').remove()
    }
    const div = document.querySelector('#inventory')
    const div2 = document.createElement('div')
    for(let id in inventory){
        const item = inventory[id]
        const button = document.createElement('button')
        button.innerHTML = item.getName()
        button.onclick = ()=>socket.emit('useItem', id)
        div2.append(button)
    }
    div.append(div2)

}