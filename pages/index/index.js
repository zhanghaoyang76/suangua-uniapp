Page({
  data: {
    entering: false
  },

  enterAsk() {
    if (this.data.entering) return

    this.setData({ entering: true })
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/ask/ask'
      })
      this.setData({ entering: false })
    }, 360)
  }
})
