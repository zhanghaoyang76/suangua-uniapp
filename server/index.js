const http = require('http')

const PORT = Number(process.env.PORT || 8787)
const ZHIPU_API_KEY = (process.env.ZHIPU_API_KEY || process.env.BIGMODEL_API_KEY || '').trim()
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4.7-flash'
const ZHIPU_THINKING_TYPE = process.env.ZHIPU_THINKING_TYPE || 'disabled'
const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPU_TIMEOUT_MS = Number(process.env.ZHIPU_TIMEOUT_MS || 30000)
const ZHIPU_MAX_TOKENS = Number(process.env.ZHIPU_MAX_TOKENS || 700)
const IS_ZHIPU_PROVIDER = ZHIPU_BASE_URL.includes('open.bigmodel.cn')

function getKeyInfo() {
  if (!ZHIPU_API_KEY) {
    return {
      configured: false
    }
  }

  return {
    configured: true,
    length: ZHIPU_API_KEY.length,
    prefix: ZHIPU_API_KEY.slice(0, 6),
    suffix: ZHIPU_API_KEY.slice(-4)
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8'
  })
  res.end(JSON.stringify(data))
}

function getProviderErrorMessage(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.message === 'string') return data.message
  if (data.error && typeof data.error === 'string') return data.error
  if (data.error && typeof data.error.message === 'string') return data.error.message
  if (data.error && data.error.metadata && typeof data.error.metadata.raw === 'string') {
    try {
      const raw = JSON.parse(data.error.metadata.raw)
      const rawMessage = getProviderErrorMessage(raw)
      if (rawMessage) return `${data.error.message || 'Provider returned error'}: ${rawMessage}`
    } catch (error) {
      return `${data.error.message || 'Provider returned error'}: ${data.error.metadata.raw.slice(0, 200)}`
    }
  }
  if (data.error && typeof data.error.msg === 'string') return data.error.msg
  if (typeof data.msg === 'string') return data.msg
  if (typeof data.code !== 'undefined') return `provider_code_${data.code}`
  return ''
}

function normalizeProviderContent(data) {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''

  const choice = Array.isArray(data.choices) ? data.choices[0] : null
  if (choice) {
    if (typeof choice.finish_reason === 'string' && choice.finish_reason !== 'stop') {
      console.warn('Zhipu choice finished without normal stop', {
        finishReason: choice.finish_reason
      })
    }

    if (choice.message && typeof choice.message.content === 'string') {
      return choice.message.content
    }

    if (choice.message && Array.isArray(choice.message.content)) {
      return choice.message.content
        .map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item.text === 'string') return item.text
          if (item && typeof item.content === 'string') return item.content
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }

    if (typeof choice.content === 'string') {
      return choice.content
    }

    if (typeof choice.text === 'string') {
      return choice.text
    }

    if (choice.delta && typeof choice.delta.content === 'string') {
      return choice.delta.content
    }

    if (choice.message && typeof choice.message.reasoning_content === 'string') {
      return choice.message.reasoning_content
    }

    if (typeof choice.reasoning_content === 'string') {
      return choice.reasoning_content
    }
  }

  if (data.data && typeof data.data.content === 'string') return data.data.content
  if (data.data && typeof data.data.output === 'string') return data.data.output
  if (typeof data.content === 'string') return data.content
  if (typeof data.text === 'string') return data.text
  if (typeof data.result === 'string') return data.result
  if (typeof data.output === 'string') return data.output

  return ''
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 1024 * 1024) {
        reject(new Error('REQUEST_TOO_LARGE'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function makePrompt(payload) {
  const chart = payload.chart || {}
  const reading = payload.reading || {}
  const keyPalace = chart.keyPalace || {}

  return [
    '你是一名面向大众用户的奇门遁甲解读助手。',
    '请根据用户问题、排盘信息和已有传统断语，生成一段中文白话“玄机详解”。',
    '要求：',
    '1. 不要提到 AI、模型、算法或系统提示。',
    '2. 语气沉稳、古风但易懂，不要恐吓用户。',
    '3. 明确说明此内容仅供娱乐参考，不替代医疗、法律、金融等专业建议。',
    '4. 分 4 到 6 段，每段 60 到 120 字。',
    '5. 给出可执行建议，但避免绝对化承诺。',
    '',
    `用户所问：${payload.question || '所问之事'}`,
    `起局：${chart.timeText || ''}，${chart.solarTerm || ''}${chart.yuan || ''}，${chart.dun || ''}${chart.juNumber || ''}局`,
    `干支：日${chart.dayGanzhi || ''}，时${chart.hourGanzhi || ''}`,
    `用宫：${keyPalace.name || ''}，${keyPalace.direction || ''}，${keyPalace.door || ''}，${keyPalace.star || ''}，${keyPalace.god || ''}`,
    `值符：${JSON.stringify(chart.valueSymbol || {})}`,
    `值使：${JSON.stringify(chart.valueEnvoy || {})}`,
    `传统断语：${reading.summary || ''}`,
    `宜：${reading.suitable || ''}`,
    `忌：${reading.avoid || ''}`,
    `提醒：${reading.advice || ''}`
  ].join('\n')
}

function makeProviderRequestBody(payload) {
  const body = {
    model: ZHIPU_MODEL,
    messages: [
      {
        role: 'user',
        content: makePrompt(payload)
      }
    ],
    max_tokens: ZHIPU_MAX_TOKENS,
    temperature: 0.7,
    stream: false
  }

  if (IS_ZHIPU_PROVIDER) {
    body.thinking = {
      type: ZHIPU_THINKING_TYPE
    }
  }

  return body
}

async function requestZhipu(payload) {
  if (!ZHIPU_API_KEY) {
    throw new Error('ZHIPU_API_KEY_MISSING')
  }

  const startedAt = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ZHIPU_TIMEOUT_MS)
  console.log('Zhipu request started', {
    model: ZHIPU_MODEL,
    baseUrl: ZHIPU_BASE_URL,
    timeoutMs: ZHIPU_TIMEOUT_MS
  })

  let response
  let responseText
  try {
    response = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${ZHIPU_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(makeProviderRequestBody(payload))
    })
    responseText = await response.text()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('ZHIPU_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }

  let data = {}
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch (error) {
    data = { message: responseText }
  }

  if (!response.ok) {
    const message = getProviderErrorMessage(data)
    console.error('Zhipu request failed', {
      status: response.status,
      model: ZHIPU_MODEL,
      key: getKeyInfo(),
      providerMessage: message,
      providerResponse: data
    })
    throw new Error(message || `ZHIPU_HTTP_${response.status}`)
  }

  const deepReading = normalizeProviderContent(data)
  if (!deepReading) {
    console.error('Zhipu response did not contain text content', {
      status: response.status,
      model: ZHIPU_MODEL,
      rawText: responseText,
      response: data
    })
    throw new Error('ZHIPU_EMPTY_RESPONSE')
  }

  console.log('Zhipu request succeeded', {
    status: response.status,
    durationMs: Date.now() - startedAt
  })

  return deepReading.trim()
}

async function handleQimenReading(req, res) {
  const rawBody = await readBody(req)
  const payload = rawBody ? JSON.parse(rawBody) : {}
  const deepReading = await requestZhipu(payload)
  sendJson(res, 200, { deepReading })
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, {
        ok: true,
        provider: 'zhipu',
        model: ZHIPU_MODEL,
        baseUrl: ZHIPU_BASE_URL,
        timeoutMs: ZHIPU_TIMEOUT_MS,
        maxTokens: ZHIPU_MAX_TOKENS,
        thinking: ZHIPU_THINKING_TYPE,
        zhipuApiKey: getKeyInfo()
      })
      return
    }

    if (req.method === 'POST' && req.url === '/api/qimen-reading') {
      await handleQimenReading(req, res)
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND' })
  } catch (error) {
    console.error('Qimen reading request failed', {
      message: error.message,
      name: error.name
    })
    const statusCode = error.message === 'ZHIPU_API_KEY_MISSING' ? 500 : 502
    sendJson(res, statusCode, {
      error: 'DEEP_READING_FAILED',
      message: error.message
    })
  }
})

server.listen(PORT, () => {
  console.log(`Qimen Zhipu reading server listening on http://127.0.0.1:${PORT}`)
  console.log('Zhipu config', {
    model: ZHIPU_MODEL,
    thinking: ZHIPU_THINKING_TYPE,
    apiKey: getKeyInfo()
  })
})
