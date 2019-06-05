import Vuex from 'vuex'
import Vue from 'vue'
import createPersistedState from 'vuex-persistedstate'
import auth from './auth'
import google from './google'
import firebase from './firebase'
import gameData from './gameData'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth,
    google,
    firebase,
    gameData
  },
  plugins: [
    createPersistedState({
      paths: [
        'auth.authentication',
        'auth.signedIn',
        'google.authorization',
        'firebase.tokenSentToServer',
        'gameData.profile',
        'gameData.history',
        'gameData.dailyFitActivities',
        'gameData.lastDateOfDailySummon'
      ]
    })
  ]
})
