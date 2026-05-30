const { makeChart } = require('../../lib/qimen')
const { interpret } = require('../../lib/interpretation')
const deepReadingService = require('../../lib/ai')

Page({
  data: {
    question: '',
    chart: null,
    reading: null,
    deepReading: '',
    deepReadingLoading: false,
    ready: false,
    leaving: false
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
    setTimeout(() => {
      this.setData({ ready: true })
    }, 30)
  },

  askDeepReading() {
    if (this.data.deepReadingLoading) return

    if (!deepReadingService.isEnabled()) {
      wx.showToast({
        title: '玄机详解暂未开启',
        icon: 'none'
      })
      return
    }

    this.setData({ deepReadingLoading: true })
    wx.showLoading({ title: '推演中' })
    deepReadingService.requestDeepReading(this.data.question, this.data.chart, this.data.reading)
      .then(deepReading => {
        this.setData({ deepReading })
      })
      .catch(error => {
        console.error('玄机详解请求失败', error)
        wx.showToast({
          title: error.message || '玄机详解暂不可用',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ deepReadingLoading: false })
        wx.hideLoading()
      })
  },

  backHome() {
    if (this.data.leaving) return

    this.setData({ leaving: true })
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }, 320)
  }
})
