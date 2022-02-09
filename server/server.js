const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

const game = require('./game')
const utils = require('./utils')
const consts = require('./consts')

app.set('views', 'views')
app.set('view engine', 'ejs')
app.use(express.static('frontend'))
app.use(express.urlencoded({ extended: true }))

const state = {}
const clientRooms = {}

io.on('connection', client => {
  client.on('init', handleInit)
  client.on('key down', utils.wrapWithParseInt(handleKey('down')))
  client.on('key up', utils.wrapWithParseInt(handleKey('up')))
  client.on('reset score', () => { state[clientRooms[client.id]].score = [0, 0] })
  client.on('change team', () => { state[clientRooms[client.id]].players[client.id].team ^= 1 })
  client.on('change name', newName => { if (newName) state[clientRooms[client.id]].players[client.id].name = newName })
  client.on('disconnect', () => {
    if (clientRooms[client.id] && state[clientRooms[client.id]]) {
      delete state[clientRooms[client.id]].players[client.id]
    }
  })

  function handleKey(type) {
    return keyCode => {
      const code = keyCode - 37
      if (code < 0 || code > 3) return
      state[clientRooms[client.id]].players[client.id].pressedKeys[code] = (type == 'down')
    }
  }

  function handleInit(roomName) {
    if (utils.isValidRoomName(roomName) === false) return
    client.emit('init', consts)
    const newGame = !state[roomName]
    if (newGame) state[roomName] = game.initState()
    state[roomName].players[client.id] = game.initPlayer()
    clientRooms[client.id] = roomName
    client.join(roomName)
    if (newGame) startGameInterval(roomName)
  }
})

function emitGameState(room, gameState) {
  io.sockets.in(room).emit('gameState', JSON.stringify(gameState));
}

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const result = game.loop(state[roomName]);
    switch (result) {
      case false:
        emitGameState(roomName, state[roomName])
        break
      case 'game abandoned':
        delete state[roomName]
        clearInterval(intervalId)
        break
    }
  }, 1000 / consts.FRAME_RATE);
}

app.get('/', (req, res) => {
  res.render('welcome_screen')
})

app.post('/*', (req, res) => {
  if ('new game' in req.body) {
    res.redirect(utils.getRandomRoomName())
    return
  }
  if ('join game' in req.body) {
    const id = req.body['join game']
    if (utils.isValidRoomName(id)) {
      res.redirect(id)
      return
    }
  }
  if ('browse games' in req.body) {
    res.redirect('browse')
    return
  }
  res.redirect('/')
})

app.get('/browse', (req, res) => {
  res.render('browse_games', {state})
})

app.get('/:id', (req, res) => {
  const roomName = req.params.id
  if (utils.isValidRoomName(roomName)) {
    res.render('game_screen')
  } else {
    res.redirect('/')
  }
})

server.listen(process.env.PORT || 3000, () => {
  console.log('listening')
})
