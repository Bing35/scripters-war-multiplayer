import {fileURLToPath, URL} from 'url'
import http from 'http'
import express from 'express'
import {Server} from 'socket.io'
import { Player, Bullet, Item} from './server/classes_units.js'

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer)

const users={
    'bob': 'bob1',
    'alice': 'alice1',
    'joe': 'joe1'
}
let loggedInUser = undefined

app.use(express.urlencoded())
app.use('/static', express.static(fileURLToPath(new URL('static/', import.meta.url))))

app.get('/login', function(req,res){
    res.sendFile(fileURLToPath(new URL('static/login.html', import.meta.url)))
})
app.post('/login', function(req,res){
    const username = req.body.username
    if(users[username] === req.body.password){
        loggedInUser = {
            'username': username,
            'password': req.body.password
        }
        // res.redirect('/')
        res.redirect('/game')
    }
    else{
        res.redirect('/login')
    }
})
app.get('/signup', function(req, res){
    res.sendFile(fileURLToPath(new URL('static/signup.html', import.meta.url)))
})
app.post('/signup', function(req,res){
    const username = req.body.username
    if(!users[username]){
        users[username] = req.body.password
        loggedInUser = {
            'username': username,
            'password': req.body.password
        }
        res.redirect('/')
    }
    else{
        res.redirect('/signup')
    }
})
app.get('/logout', function(req, res){
    loggedInUser = undefined
    res.redirect('/login')
})

// app.get('/', function(req, res){
//     if(loggedInUser){
//         res.sendFile(fileURLToPath(new URL('static/index.html', import.meta.url)))
//     }
//     else{
//         res.redirect('/login')
//     }
// })
app.get('/', function(req, res){
    res.redirect('/login')
})
app.get('/game', function(req, res){
    if(loggedInUser){
        res.sendFile(fileURLToPath(new URL('static/index.html', import.meta.url)))
    }
    else{
        res.redirect('/login')
    }
})

httpServer.listen(process.env.PORT || 5000, ()=>console.log('http server running'))


const DEBUG = true
const REFRESH_RATE = 25
const socketDict = {}
const playerDict = {}
const bulletDict = {}
const tempbullet = new Bullet(10,10,5,5,5,5)
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 400

io.on('connection', function(socket){
    console.log('socket connected');
    let thisUsername = undefined
    if(loggedInUser.username){
        thisUsername = loggedInUser.username
        socketDict[thisUsername] = socket
    }
    const id = Math.random()
    const player = new Player(30, 30, 32, 32, CANVAS_WIDTH, CANVAS_HEIGHT, 120, 120)
    player.setId(id)
    player.setCanvasStyle(400, 400)
    const mapNumber = Math.floor((Math.random()*2)+2)
    player.setMapNumber(mapNumber)
    playerDict[id] = player

    const items = []
    items.push(new Item(1, 'potion', function(){
        player.setLives(player.getMaxLives())
        return 1
    }))
    items.push(new Item(2, 'increase score', function(){
        player.setScore(player.getScore()+1)
        return 0
    }))
    player.addItems(items)

    playerFns.emitInit()
    playerFns.emitId(socket, id)
    bulletFns.emitInit(bulletDict)
    socket.emit('addItems', items)

    socket.on('disconnect', function(){
        playerFns.emitRemove(player.getId())
        delete playerDict[id]
    })

    socket.on('WASDPress', function(array){
        player.WASDPress(array[0], array[1])
    })

    socket.on('mouseClick', click=>player.mouseActions(click.button, click.isDown))
    socket.on('mouseMove', position=>player.mouseMove(position.offsetX, position.offsetY))


    socket.on('addChat', function(message){
        if(message[0] !== '/'){
            io.emit('addChat', {
                'id':thisUsername, 
                message
            })
        }
        else{
            if(DEBUG){
                message = message.slice(1)
                const data = eval(message)
                socket.emit('eval', data)
            }
        }
    })

    socket.on('addDM', function(to, message){
        if(!socketDict[to]){
            socket.emit('addDM', 'send', to, 'User does not exist')
            return
        }
        socketDict[to].emit('addDM', 'receive', thisUsername, message)
        socket.emit('addDM', 'send', to, message)
    })

    socket.on('mapChange', function(bool){
        if(!bool){
            return
        }
        const currentMapNumber = player.getMapNumber()
        if(currentMapNumber === 2){
            player.setMapNumber(3)
        }
        else{
            player.setMapNumber(2)
        }
        socket.emit('mapChange', player.getMapNumber())
    })

    socket.on('useItem', function(id){
        const quantity = player.useItem(id)
        player.removeItem(id, quantity)
        if(player.getItem(id)){
            socket.emit('updateItem', 'update', id, player.getItem(id).getQuantity())
        }
        else{
            socket.emit('updateItem', 'delete', id, undefined)
        }
        
    })
    
})

// update loop
setInterval(() => {
    playerFns.update()
    bulletFns.update()
    // io.emit('update', playerDict, bulletDict)
}, 1000/REFRESH_RATE);


const playerFns = {}
playerFns.update = function(){
    playerFns.move()
    playerFns.shoot()
    playerFns.emitUpdate()
}

playerFns.move = function(){
    for(let key in playerDict){
        const player = playerDict[key]
        player.move()
    }
}
playerFns.shoot = function(){
    for(let key in playerDict){
        const bullets = playerDict[key].shoot()
        if(Object.keys(bullets).length !== 0){
            Object.assign(bulletDict, bullets)
            bulletFns.emitInit(bullets)
        }
    }
}
playerFns.emitId = (socket, id)=>socket.emit('player', 'id', {id})
playerFns.emitInit = function(){
    io.emit('player', 'init', playerDict)
}
playerFns.emitRemove = id=>io.emit('player', 'remove', {id})
playerFns.emitUpdate = function(){
    const playerPack = {}
    for(let key in playerDict){
        const player = playerDict[key]
        playerPack[player.getId()] = {
            'x': player.getXPosition(),
            'y': player.getYPosition(),
            'direction': player.getDirection(),
            'lives': player.getLives(),
            'score': player.getScore(),
            'mapNumber': player.getMapNumber()
        }
    }
    io.emit('player', 'update', playerPack)
}


const bulletFns = {}
bulletFns.update = function(){
    bulletFns.move()
    bulletFns.collisions()
    bulletFns.emitUpdate()
}

bulletFns.move = function(){
    for(let key in bulletDict){
        bulletDict[key].move()
    }
}
bulletFns.collisions = function(){
    for(let key in bulletDict){
        for(let playerKey in playerDict){
            // if(bulletDict[key].playerCollision(playerDict[playerKey])){
            //     delete bulletDict[key]
            // }
            const bullet = bulletDict[key]
            const player = playerDict[playerKey]
            if(bullet.getMapNumber() !== player.getMapNumber()){
                continue
            }
            if(bullet.isColliding(playerDict[playerKey])){
                if(player !== bullet.getOwner()){
                    player.setLives(player.getLives()-1)
                    if(player.getLives() === 0){
                        const owner = bullet.getOwner()
                        owner.setScore(owner.getScore()+1)
                        player.respawn()
                    }
                    bulletFns.emitRemove(key)
                    delete bulletDict[key]
                    break
                }
            }
        }
    }
}
bulletFns.emitInit = function(bulletPack){
    io.emit('bullet', 'init', bulletPack)
}
bulletFns.emitRemove = id=>io.emit('bullet', 'remove', {id})
bulletFns.emitUpdate = function(){
    const bulletPack = {}
    for(let key in bulletDict){
        const bullet = bulletDict[key]
        bulletPack[key] = {
            'x': bullet.getXPosition(),
            'y': bullet.getYPosition()
        }
    }
    io.emit('bullet', 'update', bulletPack)
}

const inventoryFns = {}
