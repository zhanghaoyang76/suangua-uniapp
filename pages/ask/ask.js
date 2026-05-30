Page({
  data: {
    question: '',
    casting: false
  },

  onInput(event) {
    this.setData({
      question: event.detail.value
    })
  },

  castChart() {
    const question = this.data.question.trim()
    if (!question) {
      wx.showToast({
        title: '请先写下所问之事',
        icon: 'none'
      })
      return
    }

    this.setData({ casting: true })
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/result/result?question=${encodeURIComponent(question)}`
      })
      this.setData({ casting: false })
    }, 1450)
  }
})
