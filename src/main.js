// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueGAPI from 'vue-gapi'
const apiConfig = {
  apiKey: 'AIzaSyBeGTXxeCc77sTLG81XaryK60i3GKrTTqM',
  clientId:
    '762064213637-c9opufvkppb9bus0q8bun11iu2tc3boe.apps.googleusercontent.com',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'
  ],
  scope: 'https://www.googleapis.com/auth/fitness.activity.read'
}
Vue.use(VueGAPI, apiConfig)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
