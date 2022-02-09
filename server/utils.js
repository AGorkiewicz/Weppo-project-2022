module.exports = {
  getRandomRoomName,
  isValidRoomName,
  wrapWithParseInt,
}

const id_len = 6

function getRandomRoomName() {
  let res = ""
  for (let i = 0; i < id_len; i++) {
    res += Math.floor(Math.random() * 10)
  }
  return res
}

function isValidRoomName(id) {
  if (typeof(id) != 'string'){
    return false
  }
  if (id.length != id_len){
    return false
  }
  try {
    id = parseInt(id)
    if (id >= 0 && id <= 999999){
      return true
    }
    return false
  } catch(e) {
    return false
  }
}

function wrapWithParseInt(f) {
  return keyCode => {
    try {
      keyCode = parseInt(keyCode)
    } catch (e) {
      console.error(e)
      return
    }
    f(keyCode)
  }
}