// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import Header from './Header'
import Footer from './Footer'
import router from './router'
import { sync } from 'vuex-router-sync'
import store from './store/index'
import lodash from 'lodash'
import VueLazyload from 'vue-lazyload'

Object.defineProperty(Vue.prototype, '_', { value: lodash })

sync(store, router)

Vue.use(VueLazyload)

Vue.config.productionTip = false

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
