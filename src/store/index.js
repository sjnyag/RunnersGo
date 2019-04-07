import Vuex from 'vuex'
import Vue from 'vue'
import createPersistedState from 'vuex-persistedstate'
import auth from './auth'
import google from './google'
import firebase from './firebase'
import gamedata from './gamedata'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth,
    google,
    firebase,
    gamedata
  },
  plugins: [
    createPersistedState({
      paths: ['auth.authentication', 'auth.signedIn', 'google.authorization', 'firebase.tokenSentToServer', 'gamedata.profile', 'gamedata.history']
    })
  ]
})
