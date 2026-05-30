const RITUAL_STEPS = [
  { title: '定问事', note: '收束所问，一事一占', anim: 'seal' },
  { title: '取时辰', note: '以当前日时入局', anim: 'time' },
  { title: '定遁局', note: '按节气三元定阴阳遁局', anim: 'dun' },
  { title: '布九宫', note: '排三奇六仪、八门九星八神', anim: 'grid' },
  { title: '寻符使', note: '定值符值使，取本问关键宫', anim: 'envoy' }
]

function getStepState(count) {
  const index = Math.min(count, RITUAL_STEPS.length - 1)
  return {
    ritualSteps: RITUAL_STEPS.map((step, stepIndex) => Object.assign({}, step, {
      status: stepIndex < count ? 'done' : stepIndex === index ? 'current' : ''
    })),
    currentStep: RITUAL_STEPS[index]
  }
}

Page({
  data: {
    question: '',
    casting: false,
    transitionOut: false,
    castCount: 0,
    requiredCastCount: RITUAL_STEPS.length,
    gridCells: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ritualSteps: getStepState(0).ritualSteps,
    currentStep: getStepState(0).currentStep
  },

  onInput(event) {
    this.setData(Object.assign({
      question: event.detail.value,
      castCount: 0
    }, getStepState(0)))
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

    if (this.data.casting) {
      return
    }

    const nextCount = this.data.castCount + 1
    const isComplete = nextCount >= this.data.requiredCastCount
    const castingState = getStepState(this.data.castCount)
    const nextState = getStepState(nextCount)

    this.setData(Object.assign({
      casting: true
    }, castingState))
    setTimeout(() => {
      if (isComplete) {
        this.setData({ transitionOut: true })
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/result/result?question=${encodeURIComponent(question)}`
          })
          this.setData(Object.assign({
            casting: false,
            transitionOut: false,
            castCount: 0
          }, getStepState(0)))
        }, 360)
        return
      }

      this.setData(Object.assign({
        casting: false,
        castCount: nextCount
      }, nextState))
    }, 720)
  }
})
