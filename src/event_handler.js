import { calculatePenetration } from "./collision_detector.js"
import { Flower, Mushroom, Player, Player2 } from "./game_objects.js"
import Game from "./game.js"
import config from "./config.js"


export default class InputHandler {

  static events = new Set()
  static commands = []

  constructor() {
    // Setup Eventlisteners
    window.onkeydown = (ev) => {InputHandler.events.add(ev.code)}
    window.onkeyup = (ev) => {InputHandler.events.delete(ev.code)}
    Object.entries(config["keys"]).forEach(([key, callback]) => {
      new Command(key, callback)
    })
  }

  static handleAllEvents() {
    InputHandler.events.forEach((ev) => {
      InputHandler.commands.forEach(command => {
        if (command.key === ev) {
          command.callback()
        }
      })
    })
    
  }
}


class Command {
  constructor(key, callback) {
    this.key = key
    this.callback = callback
    InputHandler.commands.push(this)
  }
}

export class GravityHandler {
  constructor(options) {
    this.gravity = 0
    this.maxGravity = options.maxGravity
    this.jumpForce = options.jumpForce
    this.gravityForce = options.gravityForce || 0
  }

  jump(gameObject) {
    if (gameObject.isStanding) {
      this.gravity = this.jumpForce
      gameObject.isStanding = false
    }
  }

  _handleEvents(gameObject) {
    gameObject.y = gameObject.y + this.gravity
    this.gravity = Math.min(this.gravity + this.gravityForce, this.maxGravity)
  }
}

export class HandlerManager {
  constructor(handlers) {
    this.handlers = [...handlers]
  }

  add(handler) {
    this.handlers.push(handler)
  }

  remove(handler) {
    this.handlers.splice(this.handlers.indexOf(handler), 1)
  }

  get(handlerType) {
    let result = this.handlers.filter(handler => handler instanceof handlerType)
    return result[0]
  }

  runAll(gameObject) {
    this.handlers.forEach(handler => handler._handleEvents(gameObject))
  }
}

export class CollisionHandler {
  _handleEvents(gameObject, options) {
    // Es soll nichts passieren wenn kein anderes Objekt gesetzt wird
    if (options == null) return

    // Wenn das andere Objekt der Spieler ist, soll nicht passieren
    if (options.other instanceof Player) return

    let collidingObject = options.other

    // Wenn das andere Objekt aus der Welt oder dem Wald ist,
    // soll eine Überschneidung vermieden werden, indem das
    // Objekt aus dem überschneidenden Objekt herausgedrückt wird.
    if (collidingObject.collisionTags.includes("world") || collidingObject.collisionTags.includes("forest")) {
      const pen = calculatePenetration(gameObject, collidingObject)
      if (Math.abs(pen.x) <= Math.abs(pen.y)) {
        gameObject.x = gameObject.x - pen.x
      } else {
        gameObject.y = gameObject.y - pen.y
        const gravityHandler = gameObject.handlers.get(GravityHandler)
        if (gravityHandler != null) {
          if (gravityHandler.gravity >= 0) {
            gameObject.isStanding = true
          }
          gravityHandler.gravity = 0
        }
      }
    }

    // Wenn das kollidierende Objekt aus Pickups ist, wird es entfernt.
    if (collidingObject.collisionTags.includes("pickups")) {
      collidingObject.destroy()
      if (collidingObject instanceof Flower) {
        gameObject.speed = 6
        setInterval(function() {
          gameObject.speed = 3
        }, 2000)
      }
      
      else if (collidingObject instanceof Mushroom) {
        gameObject.speed = 1
        setInterval(function() {
          gameObject.speed = 3
        }, 2000)
      }
    }

    if (collidingObject.collisionTags.includes("cave")) {
      console.log(collidingObject)
      if (collidingObject.forPlayer === 2 && gameObject.playerNumber === 1) {
        Game.punkteSpieler1 += 1
        const elem = document.querySelector("#spielstand")
        elem.textContent = Game.punkteSpieler1 + " - " + Game.punkteSpieler2
        elem.style.display = "flex"
        console.log(Game.punkteSpieler1 + " - " + Game.punkteSpieler2)
        setTimeout(function() {
          elem.style.display = "none"
          Game.loadMap("maps/map-02.txt")
}, 2000)
        
        
      }
      else if (collidingObject.forPlayer === 1 && gameObject.playerNumber === 2) {
        Game.punkteSpieler1 += 1
        const elem = document.querySelector("#spielstand")
        document.querySelector("#punkte-s1").textContent = Game.punkteSpieler1
        document.querySelector("#punkte-s2").textContent = Game.punkteSpieler2
        document.querySelector("#winner").textContent = "Spieler 2 gewonnen"
        elem.style.display = "flex"
        console.log(Game.punkteSpieler1 + " - " + Game.punkteSpieler2)
        setTimeout(function() {
          elem.style.display = "none"
          if (Game.level === 1){
            Game.loadMap("maps/map-02.txt")
          }
          if (Game.level === 2){
            Game.loadMap("maps/map-03.txt")
          }
          if (Game.level === 3){
            Game.loadMap("maps/map-04.txt")
          }
        
}, 2000)
      }
      
    }
  }
}

export class AnimationHandler {
  constructor(options) {
    this.frameCounter = 0
    this.framesPerAnimation = options.framesPerAnimation
    this.numberOfFrames = options.numberOfFrames
  }

  _handleEvents(gameObject) {
    // Only run the animation if the object moved
    if (gameObject.dx != 0 || gameObject.dy != 0) {
      this.frameCounter++
      if (this.frameCounter >= this.framesPerAnimation) {
        gameObject.col++
        if (gameObject.col >= this.numberOfFrames) {
          gameObject.col = 0
        }
        this.frameCounter = 0
      }
    }

  }
}