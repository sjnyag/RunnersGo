import Vuex from 'vuex'
import Vue from 'vue'
import createPersistedState from 'vuex-persistedstate'
import auth from './auth'
import google from './google'
import firebase from './firebase'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth,
    google,
    firebase
  },
  plugins: [
    createPersistedState({
      paths: ['auth.profile', 'auth.signedIn', 'google.authorization', 'firebase.tokenSentToServer']
    })
  ]
})
