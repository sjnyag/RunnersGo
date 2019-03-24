import Vue from 'vue'
import Router from 'vue-router'
import Top from '@/components/Top'
import Home from '@/components/Home'
import History from '@/components/History'
import store from '../store/index'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Top',
      component: Top,
      meta: {
        title: '',
        hideHeader: true,
        hideFooter: true
      }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: {
        title: 'Home'
      }
    },
    {
      path: '/history',
      name: 'History',
      component: History,
      meta: {
        title: 'History'
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  console.log('Routing to...' + to.name)
  console.log(store.state)
  if (!store.state.firebase.tokenSentToServer && store.state.auth.profile.id) {
    store.dispatch('firebase/requestMessagingPermission')
  }
  if (to.name === from.name) {
    next()
  } else if (store.state.auth.signedIn || to.name === 'Top') {
    next()
  } else {
    console.log('Redirect to...Top')
    next('/')
  }
})
export default router
