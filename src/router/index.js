import Vue from 'vue'
import Router from 'vue-router'
import Top from '@/components/Top'
import Home from '@/components/Home'
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
        hideHeader: true
      }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: {
        title: 'Home'
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  console.log('Routing to...' + to.name)
  console.log(store.state)
  const loginStateRouter = () => {
    if (store.state.auth.signedIn || to.name === 'Top') {
      next()
    } else {
      next('/')
    }
  }
  if (to.name === from.name) {
    next()
  } else if (!store.state.auth.clientInitialized) {
    store.dispatch('auth/initGapi').then(loginStateRouter)
  } else {
    loginStateRouter()
  }
})
export default router
