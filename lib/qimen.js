const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const DOORS = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']
const STARS = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽']
const GODS = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']
const PALACES = [
  { id: 4, name: '巽四宫', direction: '东南' },
  { id: 9, name: '离九宫', direction: '正南' },
  { id: 2, name: '坤二宫', direction: '西南' },
  { id: 3, name: '震三宫', direction: '正东' },
  { id: 5, name: '中五宫', direction: '中宫' },
  { id: 7, name: '兑七宫', direction: '正西' },
  { id: 8, name: '艮八宫', direction: '东北' },
  { id: 1, name: '坎一宫', direction: '正北' },
  { id: 6, name: '乾六宫', direction: '西北' }
]

const SOLAR_TERMS = [
  { name: '小寒', month: 1, day: 6, dun: '阳遁', ju: [2, 8, 5] },
  { name: '大寒', month: 1, day: 20, dun: '阳遁', ju: [3, 9, 6] },
  { name: '立春', month: 2, day: 4, dun: '阳遁', ju: [8, 5, 2] },
  { name: '雨水', month: 2, day: 19, dun: '阳遁', ju: [9, 6, 3] },
  { name: '惊蛰', month: 3, day: 6, dun: '阳遁', ju: [1, 7, 4] },
  { name: '春分', month: 3, day: 21, dun: '阳遁', ju: [3, 9, 6] },
  { name: '清明', month: 4, day: 5, dun: '阳遁', ju: [4, 1, 7] },
  { name: '谷雨', month: 4, day: 20, dun: '阳遁', ju: [5, 2, 8] },
  { name: '立夏', month: 5, day: 6, dun: '阳遁', ju: [4, 1, 7] },
  { name: '小满', month: 5, day: 21, dun: '阳遁', ju: [5, 2, 8] },
  { name: '芒种', month: 6, day: 6, dun: '阳遁', ju: [6, 3, 9] },
  { name: '夏至', month: 6, day: 21, dun: '阴遁', ju: [9, 3, 6] },
  { name: '小暑', month: 7, day: 7, dun: '阴遁', ju: [8, 2, 5] },
  { name: '大暑', month: 7, day: 23, dun: '阴遁', ju: [7, 1, 4] },
  { name: '立秋', month: 8, day: 8, dun: '阴遁', ju: [2, 5, 8] },
  { name: '处暑', month: 8, day: 23, dun: '阴遁', ju: [1, 4, 7] },
  { name: '白露', month: 9, day: 8, dun: '阴遁', ju: [9, 3, 6] },
  { name: '秋分', month: 9, day: 23, dun: '阴遁', ju: [7, 1, 4] },
  { name: '寒露', month: 10, day: 8, dun: '阴遁', ju: [6, 9, 3] },
  { name: '霜降', month: 10, day: 24, dun: '阴遁', ju: [5, 8, 2] },
  { name: '立冬', month: 11, day: 8, dun: '阴遁', ju: [6, 9, 3] },
  { name: '小雪', month: 11, day: 22, dun: '阴遁', ju: [5, 8, 2] },
  { name: '大雪', month: 12, day: 7, dun: '阴遁', ju: [4, 7, 1] },
  { name: '冬至', month: 12, day: 22, dun: '阳遁', ju: [1, 7, 4] }
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function startOfTerm(year, term) {
  return new Date(year, term.month - 1, term.day, 0, 0, 0, 0)
}

function getCurrentTerm(date) {
  const year = date.getFullYear()
  let current = SOLAR_TERMS[SOLAR_TERMS.length - 1]
  let currentDate = startOfTerm(year - 1, current)

  for (let i = 0; i < SOLAR_TERMS.length; i += 1) {
    const termDate = startOfTerm(year, SOLAR_TERMS[i])
    if (termDate <= date && termDate >= currentDate) {
      current = SOLAR_TERMS[i]
      currentDate = termDate
    }
  }

  return { term: current, start: currentDate }
}

function getYuan(date, termStart) {
  const diffDays = Math.floor((date - termStart) / 86400000)
  if (diffDays < 5) return { name: '上元', index: 0 }
  if (diffDays < 10) return { name: '中元', index: 1 }
  return { name: '下元', index: 2 }
}

function cycleIndexFromDate(date, offset) {
  const base = new Date(1900, 0, 31)
  const days = Math.floor((date - base) / 86400000)
  return ((days + offset) % 60 + 60) % 60
}

function ganzhiFromIndex(index) {
  return STEMS[index % 10] + BRANCHES[index % 12]
}

function getHourBranchIndex(date) {
  const hour = date.getHours()
  if (hour === 23) return 0
  return Math.floor((hour + 1) / 2) % 12
}

function rotate(list, amount) {
  return list.map((_, index) => list[(index + amount) % list.length])
}

function scoreDoor(door) {
  if (door === '开门' || door === '生门' || door === '休门') return 2
  if (door === '景门' || door === '杜门') return 0
  if (door === '伤门' || door === '惊门') return -1
  return -2
}

function pickKeyPalace(question, date) {
  const seed = `${question || ''}${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}`
  let total = 0
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i)
  return total % PALACES.length
}

function buildPalaces(juNumber, dun, date, question) {
  const direction = dun === '阳遁' ? 1 : -1
  const offset = (juNumber - 1) * direction + getHourBranchIndex(date)
  const doors = rotate(DOORS, ((offset % DOORS.length) + DOORS.length) % DOORS.length)
  const stars = rotate(STARS, ((offset % STARS.length) + STARS.length) % STARS.length)
  const gods = rotate(GODS, ((offset % GODS.length) + GODS.length) % GODS.length)
  const keyIndex = pickKeyPalace(question, date)

  return PALACES.map((palace, index) => {
    const stemIndex = (index + juNumber + getHourBranchIndex(date)) % STEMS.length
    const door = doors[index % doors.length]
    return {
      ...palace,
      door,
      star: stars[index % stars.length],
      god: gods[index % gods.length],
      heavenlyStem: STEMS[stemIndex],
      earthlyStem: STEMS[(stemIndex + 5) % STEMS.length],
      score: scoreDoor(door),
      isKey: index === keyIndex
    }
  })
}

function makeChart(inputDate, question) {
  const date = inputDate ? new Date(inputDate) : new Date()
  const { term, start } = getCurrentTerm(date)
  const yuan = getYuan(date, start)
  const juNumber = term.ju[yuan.index]
  const dayIndex = cycleIndexFromDate(date, 0)
  const hourIndex = (dayIndex % 5) * 12 + getHourBranchIndex(date)
  const palaces = buildPalaces(juNumber, term.dun, date, question)
  const keyPalace = palaces.find(item => item.isKey) || palaces[4]
  const valueSymbolPalace = palaces.find(item => item.god === '值符') || palaces[0]
  const valueEnvoyPalace = palaces.find(item => item.door === keyPalace.door) || keyPalace

  return {
    question: question || '',
    timeText: formatDate(date),
    solarTerm: term.name,
    yuan: yuan.name,
    dun: term.dun,
    juNumber,
    dayGanzhi: ganzhiFromIndex(dayIndex),
    hourGanzhi: ganzhiFromIndex(hourIndex),
    palaces,
    keyPalace,
    valueSymbol: {
      palace: valueSymbolPalace.name,
      star: valueSymbolPalace.star,
      god: valueSymbolPalace.god
    },
    valueEnvoy: {
      palace: valueEnvoyPalace.name,
      door: valueEnvoyPalace.door
    },
    processSteps: [
      `定问事：以“${question || '所问之事'}”为占，不杂二念`,
      `取时辰：${formatDate(date)}，日干支${ganzhiFromIndex(dayIndex)}，时干支${ganzhiFromIndex(hourIndex)}`,
      `定遁局：节气取${term.name}，分属${yuan.name}，成${term.dun}${juNumber}局`,
      `布盘：三奇六仪入九宫，排八门、九星、八神`,
      `寻符使：值符临${valueSymbolPalace.name}，值使取${valueEnvoyPalace.door}`,
      `取用：本问关键落${keyPalace.name}，观${keyPalace.door}、${keyPalace.star}、${keyPalace.god}`
    ]
  }
}

module.exports = {
  makeChart,
  formatDate
}
