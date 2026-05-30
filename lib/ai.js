const features = require('../config/features')

function isEnabled() {
  return Boolean(features.deepReadingEnabled)
}

function formatPalace(palace) {
  return `${palace.name}（${palace.direction}）：${palace.door}、${palace.star}、${palace.god}，天盘${palace.heavenlyStem}，地盘${palace.earthlyStem}`
}

function buildPayload(question, chart, reading) {
  return {
    question,
    chart: {
      timeText: chart.timeText,
      solarTerm: chart.solarTerm,
      yuan: chart.yuan,
      dun: chart.dun,
      juNumber: chart.juNumber,
      dayGanzhi: chart.dayGanzhi,
      hourGanzhi: chart.hourGanzhi,
      keyPalace: chart.keyPalace,
      valueSymbol: chart.valueSymbol,
      valueEnvoy: chart.valueEnvoy,
      palaces: chart.palaces
    },
    reading
  }
}

function normalizeResponse(data) {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''
  return data.deepReading || data.reading || data.text || data.content || data.result || ''
}

function getErrorMessage(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.message === 'string') return data.message
  if (data.error && typeof data.error === 'string') return data.error
  if (data.error && typeof data.error.message === 'string') return data.error.message
  return ''
}

function requestRemoteReading(question, chart, reading) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: features.deepReadingEndpoint,
      method: 'POST',
      timeout: features.deepReadingTimeout || 20000,
      header: {
        'content-type': 'application/json'
      },
      data: buildPayload(question, chart, reading),
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(getErrorMessage(res.data) || 'DEEP_READING_HTTP_ERROR'))
          return
        }

        const text = normalizeResponse(res.data)
        if (!text) {
          reject(new Error('DEEP_READING_EMPTY'))
          return
        }

        resolve(text)
      },
      fail(error) {
        reject(new Error((error && error.errMsg) || 'DEEP_READING_REQUEST_FAILED'))
      }
    })
  })
}

function makeLocalDeepReading(question, chart, reading) {
  const key = chart.keyPalace
  const valueSymbol = chart.valueSymbol
  const valueEnvoy = chart.valueEnvoy
  const asked = question || '所问之事'

  const paragraphs = [
    `你问“${asked}”，本局取${chart.timeText}起盘，节气为${chart.solarTerm}${chart.yuan}，成${chart.dun}${chart.juNumber}局。日为${chart.dayGanzhi}，时为${chart.hourGanzhi}，说明此事宜从当下的时势与人事互动中看端倪。`,
    `用宫落在${formatPalace(key)}。${reading.summary}${key.door}主事机的开合，${key.star}看其内在走势，${key.god}多提示过程中的助力、遮蔽或反复之处。`,
    `值符临${valueSymbol.palace}，见${valueSymbol.star}；值使取${valueEnvoy.door}，落${valueEnvoy.palace}。这表示判断此事时，不只看结果吉凶，更要看主导者、关键节点和行动方式是否同向。`,
    `可行之处：${reading.suitable} 需要避开的地方：${reading.avoid}`,
    `落到行动上，先做一件能降低不确定性的小事，再决定是否扩大投入。${reading.advice}`
  ]

  return paragraphs.join('\n\n')
}

function requestDeepReading(question, chart, reading) {
  if (!isEnabled()) {
    return Promise.reject(new Error('DEEP_READING_DISABLED'))
  }

  if (features.deepReadingEndpoint) {
    return requestRemoteReading(question, chart, reading)
  }

  return Promise.resolve(makeLocalDeepReading(question, chart, reading))
}

module.exports = {
  isEnabled,
  requestDeepReading
}
