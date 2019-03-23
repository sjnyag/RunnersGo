// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import Header from './Header'
import Footer from './Footer'
import router from './router'
import VueLazyload from 'vue-lazyload'
import store from './store/index'
import { sync } from 'vuex-router-sync'
import lodash from 'lodash'
import firebase from 'firebase/app'
import 'firebase/messaging'

Object.defineProperty(Vue.prototype, '_', { value: lodash })

sync(store, router)

Vue.use(VueLazyload)

Vue.config.productionTip = false
firebase.initializeApp({...process.env.config, apiKey: process.env.API_KEY})
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

/* eslint-disable no-new */
new Vue({
  el: '#footer',
  router,
  store,
  components: { Footer },
  template: '<Footer/>'
})
