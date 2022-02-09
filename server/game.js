const consts = require('./consts')
const mx = consts.MX - 1
const my = consts.MY - 1

module.exports = {
  initState,
  initPlayer,
  loop,
}

function sq(a) { return a * a }

function len(a) { return a.x * a.x + a.y * a.y }

function plus(a, b) { return { x: a.x + b.x, y: a.y + b.y } }

function minus(a, b) { return { x: a.x - b.x, y: a.y - b.y } }

function scale(a, s) {
  const l = len(a)
  if (l < 0.0001) return
  const p = s / Math.sqrt(l)
  a.x *= p
  a.y *= p
}

function randomPos() {
  return {
    x: consts.SPAWN_MIN_DIS + Math.random() * (mx - 2 * consts.SPAWN_MIN_DIS),
    y: consts.SPAWN_MIN_DIS + Math.random() * (my - 2 * consts.SPAWN_MIN_DIS),
  }
}

function initBall() {
  return {
    pos: randomPos(),
    vel: { x: 0, y: 0 },
  }
}

function initPlayer() {
  return {
    pos: randomPos(),
    pressedKeys: [false, false, false, false],
    team: 0,
    name: 'Player',
  }
}

function initState() {
  return {
    players: {},
    ball: initBall(),
    score: [0, 0],
  }
}

function updatePlayer(player) {
  const keys = player.pressedKeys
  let { x, y } = player.pos
  const vec = {
    x: keys[2] - keys[0],
    y: keys[3] - keys[1]
  }
  scale(vec, consts.PLAYER_VEL)
  x += vec.x
  y += vec.y
  const r = consts.PLAYER_R
  if (x < r) x = r
  if (y < r) y = r
  if (x > mx - r) x = mx - r
  if (y > my - r) y = my - r
  player.pos = { x, y }
}

function updateBall(state) {
  const ball = state.ball
  const players = state.players
  const r = consts.BALL_R
  const pos = ball.pos
  const vel = ball.vel
  pos.x += vel.x
  pos.y += vel.y
  vel.x *= consts.BALL_VEL_DECAY
  vel.y *= consts.BALL_VEL_DECAY

  function relax(player, maxDis, resetVel) {
    const vec = minus(ball.pos, player.pos)
    if (len(vec) < sq(maxDis)) {
      if (resetVel) {
        scale(vec, consts.BALL_VEL)
      } else {
        scale(vec, Math.sqrt(len(ball.vel)))
      }
      ball.vel.x = vec.x
      ball.vel.y = vec.y
      scale(vec, maxDis)
      ball.pos = plus(ball.pos, vec)
    }
  }

  for (playerId in players) {
    relax(players[playerId], consts.BALL_R + consts.PLAYER_R, true)
  }

  const H1 = (consts.MY - consts.GOAL_HEIGHT) / 2
  const H2 = (consts.MY + consts.GOAL_HEIGHT) / 2

  for (x of [0, mx]) {
    for (y of [H1, H2]) {
      relax({ pos: { x, y } }, consts.BALL_R + consts.POST_R, false)
    }
  }

  if (pos.y < r) { pos.y = r; vel.y *= -1 }
  if (pos.y > my - r) { pos.y = my - r; vel.y *= -1 }

  if (pos.y < H1 || pos.y > H2) {
    if (pos.x < r) { pos.x = r; vel.x *= -1 }
    if (pos.x > mx - r) { pos.x = mx - r; vel.x *= -1 }
  }
  if (pos.x < -r) {
    state.score[0] += 1
    state.ball = initBall()
  }
  if (pos.x > mx + r) {
    state.score[1] += 1
    state.ball = initBall()
  }
}

function loop(state) {
  if (Object.keys(state.players).length == 0) {
    return 'game abandoned'
  }

  for (playerId in state.players) {
    updatePlayer(state.players[playerId])
  }

  updateBall(state)

  return false
}