const RISK_WORDS = ['生病', '疾病', '癌', '手术', '股票', '基金', '投资', '借贷', '官司', '诉讼', '离婚', '报警']

function includesRisk(question) {
  return RISK_WORDS.some(word => question.indexOf(word) >= 0)
}

function levelFromScore(score) {
  if (score >= 2) return '吉'
  if (score <= -2) return '凶'
  return '平'
}

function makeSuitable(level, door) {
  if (level === '吉') return `宜顺势推进，宜择明处行事，${door}主有可为之机。`
  if (level === '凶') return `宜守不宜进，宜缓议、避争、少作仓促决定。`
  return `宜先观望，宜整理线索，待时机明朗再动。`
}

function makeAvoid(level) {
  if (level === '吉') return '忌贪快冒进，忌言多失据。'
  if (level === '凶') return '忌强行推进，忌口舌争执，忌孤注一掷。'
  return '忌摇摆反复，忌听信片面之言。'
}

function interpret(question, chart) {
  const key = chart.keyPalace
  const level = levelFromScore(key.score)
  const risk = includesRisk(question)
  const direction = key.direction === '中宫' ? '中宫' : key.direction

  const summaryMap = {
    吉: `本局关键落${key.name}，得${key.door}、${key.star}相临，象有开合之机。所问之事可趁势而行，但须守正，不宜躁进。`,
    平: `本局关键落${key.name}，门星之象平稳，吉凶未定。此事尚有回旋余地，宜先明辨虚实，再定进退。`,
    凶: `本局关键落${key.name}，逢${key.door}，象中有阻。所问之事不宜强求，宜退一步审势，避开口舌与反复。`
  }

  return {
    level,
    summary: summaryMap[level],
    suitable: makeSuitable(level, key.door),
    avoid: makeAvoid(level),
    advice: risk
      ? '此问涉及高风险事项，本断仅作娱乐参考；现实决策请咨询专业人士。'
      : `可留意${direction}方向或与${key.god}、${key.star}所象相关的人事变化，凡事以稳为上。`
  }
}

module.exports = {
  interpret
}
