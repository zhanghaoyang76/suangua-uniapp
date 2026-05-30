const { makeChart } = require('../../lib/qimen')
const { interpret } = require('../../lib/interpretation')
const ai = require('../../lib/ai')

Page({
  data: {
    question: '',
    chart: null,
    reading: null
  },

  onLoad(options) {
    const question = decodeURIComponent(options.question || '')
    const chart = makeChart(new Date(), question)
    const reading = interpret(question, chart)

    this.setData({
      question,
      chart,
      reading
    })
  },

  askAi() {
    if (!ai.isEnabled()) {
      wx.showToast({
        title: '此功能暂未开启',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '解读中' })
    ai.requestDeepReading(this.data.question, this.data.chart, this.data.reading)
      .catch(() => {
        wx.showToast({
          title: '深度解读暂不可用',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
