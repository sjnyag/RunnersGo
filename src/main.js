// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import Header from './Header'
import router from './router'
import store from './store/index'
import { sync } from 'vuex-router-sync'
import lodash from 'lodash'
import firebase from 'firebase/app'
import 'firebase/messaging'
import '../node_modules/firebaseui/dist/firebaseui.css'

Object.defineProperty(Vue.prototype, '_', { value: lodash })

sync(store, router)

const apiConfig = {
  apiKey: process.env.config.apiKey,
  clientId: process.env.config.clientId,
  discoveryDocs: process.env.config.discoveryDocs,
  scope: process.env.config.scopes.join(' ')
}

Vue.config.productionTip = false
firebase.initializeApp(process.env.config)
if (process.env.NODE_ENV === 'production') {
  const messaging = firebase.messaging()
  messaging.usePublicVapidKey(process.env.public_valid_key)
  Vue.prototype.$messaging = messaging
} else {
  Vue.prototype.$messaging = {
    onTokenRefresh: callback => {
      callback()
    },
    getToken: () => {
      return new Promise(function(resolve) {
        resolve('SampleToken_' + new Date().getTime())
      })
    },
    onMessage: () => {},
    requestPermission: () => {
      return new Promise(function(resolve) {
        resolve('SampleToken_' + new Date().getTime())
      })
    }
  }
}
firebase.auth().onAuthStateChanged(user => {
  console.log('onAuthStateChanged', user)
  // Make sure there is a valid user object
  if (user) {
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://apis.google.com/js/api.js'
    // Once the Google API Client is loaded, you can run your code
    script.onload = function(e) {
      // Initialize the Google API Client with the config object
      window.gapi.load('client:auth2', () => {
        window.gapi.client
          .init(apiConfig)
          .then(_ => {
            router.push('/home')
          })
          .catch(_ => {
            firebase.auth().signOut()
          })
      })
    }
    // Add to the document
    document.getElementsByTagName('head')[0].appendChild(script)
  } else {
    router.push('/login')
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})

/* eslint-disable no-new */
new Vue({
  el: '#header',
  router,
  store,
  components: { Header },
  template: '<Header/>'
})
