const {Unit, Player, Enemy, Bullet, Map, Item} = require('./classes_units.js')

const REFRESH_RATE = 25
const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 300
const GAME_WIDTH = 1200
const GAME_HEIGHT = 900


describe('testing Unit', function(){
    const GAME_WIDTH = 1200
    const GAME_HEIGHT = 900
    let unit1 = undefined

    beforeEach(function(){
        jest.useFakeTimers()
        unit1 = new Unit(50,60,20,20,300,300)
    })
    afterEach(function(){
        jest.useFakeTimers()
    })

    test('getters and setters', function(){
        expect(unit1.getXPosition()).toBe(50)
        expect(unit1.getYPosition()).toBe(60)
        unit1.setPosition(17,39)
        expect(unit1.getXPosition()).toBe(17)
        expect(unit1.getYPosition()).toBe(39)
        // setPosition uses game dimensions
        unit1.setPosition(GAME_WIDTH+30, GAME_HEIGHT+27)
        expect(unit1.getXPosition()).toBe(GAME_WIDTH-10)
        expect(unit1.getYPosition()).toBe(GAME_HEIGHT-10)
    })

    test('.isColliding', function(){
        const unit2 = new Unit(55,80,20,20,300,300)
        expect(unit1.isColliding(unit2)).toBe(true)
        const unit3 = new Unit(71,81,20,20,300,300)
        expect(unit1.isColliding(unit3)).toBe(false)
    })

    test('.isOutOfBounds', function(){
        const unit2 = new Unit(GAME_WIDTH+90,80,20,20,300,300)
        expect(unit2.isOutOfBounds()).toBe(true)
        const unit3 = new Unit(80,GAME_HEIGHT+27,20,20,300,300)
        expect(unit3.isOutOfBounds()).toBe(true)
    })

    test('.updateAnimationCounter', function(){
        let counter = 0
        expect(unit1.getAnimationCounter()).toBe(0)
        increaseAnimationCounter()


        function increaseAnimationCounter(){
            if(counter > unit1.getAnimationMaxCounter()){
                return
            }

            unit1.updateAnimationCounter()
            jest.runOnlyPendingTimers()
            counter++
            if(counter === unit1.getAnimationMaxCounter()){
                counter = 0
            }
            expect(unit1.getAnimationCounter()).toBe(counter)
            setTimeout(() => {
                increaseAnimationCounter()
            }, 0);
        }
    })
})

describe('testing Player', function(){
    let player1 = undefined
    beforeEach(function(){
        player1 = new Player(50,50,20,20, CANVAS_WIDTH, CANVAS_HEIGHT, 10, 10)
    })

    test('assign keys', function(){
        player1.WASDPress('w', true)
        expect(player1.getDirection().y).toBe(-1)
        player1.WASDPress('w', false)
        expect(player1.getDirection().y).toBe(0)

        player1.WASDPress('d', true)
        expect(player1.getDirection().x).toBe(1)
        player1.WASDPress('d', false)
        expect(player1.getDirection().x).toBe(0)
    })

    test('move', function(){
        const initX = player1.getXPosition()
        const initY = player1.getYPosition()

        player1.WASDPress('w', true)
        player1.WASDPress('d', true)
        player1.move()

        const endX = player1.getXPosition()
        const calculatedX = initX+(player1.getXSpeed()/REFRESH_RATE)*player1.getDirection().x
        const endY = player1.getYPosition()
        const calculatedY = initY+(player1.getYSpeed()/REFRESH_RATE)*player1.getDirection().y

        expect(endX).toBeCloseTo(calculatedX)
        expect(endY).toBeCloseTo(calculatedY)
    })
})
