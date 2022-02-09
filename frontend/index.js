const roomName = window.location.pathname.substring(1)
const socket = io()
let canvas, ctx, C

socket.emit('init', roomName)

document.getElementById('resetScoreButton').addEventListener('click', () => { socket.emit('reset score') })
document.getElementById('changeTeamButton').addEventListener('click', () => { socket.emit('change team') })
document.getElementById('changeNameButton').addEventListener('click', () => {
  socket.emit('change name', document.getElementById('newNameInput').value)
})


socket.on('init', consts => {

  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')
  C = consts

  canvas.width = C.MX
  canvas.height = C.MY

  ctx.lineWidth = 1

  paintBackground()

  document.addEventListener('keydown', e => { socket.emit('key down', e.keyCode) })
  document.addEventListener('keyup', e => { socket.emit('key up', e.keyCode) })
})

function paintBackground() {
  ctx.fillStyle = C.BACKGROUND_COLOR
  ctx.strokeStyle = C.BACKGROUND_OUTLINE
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeRect(0, 0, canvas.width, canvas.height)
}

function paintGame(state) {
  document.getElementById('roomNameDisplay').innerText = roomName
  document.getElementById('scoreDisplay0').innerText = state.score[0] + ''
  document.getElementById('scoreDisplay1').innerText = state.score[1] + ''

  paintBackground()

  function paintCircle(pos, r, fillStyle, strokeStyle) {
    ctx.fillStyle = fillStyle
    ctx.strokeStyle = strokeStyle
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

  function paintName(pos, text, fillStyle) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = fillStyle
    ctx.fillText(text, pos.x, pos.y, 2 * C.PLAYER_R)
  }

  for (playerId in state.players) {
    const player = state.players[playerId]
    paintCircle(player.pos, C.PLAYER_R, C.PLAYER_COLOR[player.team], C.PLAYER_OUTLINE[player.team])
    paintName(player.pos, player.name, C.PLAYER_NAME_COLOR)
  }

  const myPlayer = state.players[socket.id]
  paintCircle(myPlayer.pos, C.PLAYER_R, C.MY_COLOR[myPlayer.team], C.MY_OUTLINE[myPlayer.team])
  paintName(myPlayer.pos, myPlayer.name, C.PLAYER_NAME_COLOR)

  paintCircle(state.ball.pos, C.BALL_R, C.BALL_COLOR, C.BALL_OUTLINE)

  ctx.fillStyle = C.GOAL_COLOR[0]
  ctx.fillRect(0, (C.MY - C.GOAL_HEIGHT) / 2, C.GOAL_WIDTH, C.GOAL_HEIGHT)
  ctx.fillStyle = C.GOAL_COLOR[1]
  ctx.fillRect(C.MX - C.GOAL_WIDTH, (C.MY - C.GOAL_HEIGHT) / 2, C.GOAL_WIDTH, C.GOAL_HEIGHT)

  const H1 = (C.MY - C.GOAL_HEIGHT) / 2
  const H2 = (C.MY + C.GOAL_HEIGHT) / 2

  for (x of [0, C.MX - 1]) {
    for (y of [H1, H2]) {
      paintCircle({ x, y }, C.POST_R, C.POST_COLOR)
    }
  }
}

socket.on('gameState', gameState => {
  requestAnimationFrame(() => paintGame(JSON.parse(gameState)))
})