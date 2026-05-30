const features = require('../config/features')

function isEnabled() {
  return Boolean(features.aiEnabled)
}

function requestDeepReading() {
  if (!isEnabled()) {
    return Promise.reject(new Error('AI_DISABLED'))
  }

  return Promise.reject(new Error('AI_NOT_CONFIGURED'))
}

module.exports = {
  isEnabled,
  requestDeepReading
}
