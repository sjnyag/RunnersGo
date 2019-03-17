import Vue from 'vue'
import Router from 'vue-router'
import Top from '@/components/Top'
import Login from '@/components/Login'
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
        title: ''
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        title: 'Login'
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
  if (to.name === 'Top' || to.name === 'Login') {
    next()
  } else {
    if (!store.state.auth.signedIn) {
      next('/')
    } else if (!store.state.auth.clientInitialized) {
      store.dispatch('auth/initGapi').then(() => {
        if (!store.state.auth.signedIn) {
          next('/')
        } else {
          next()
        }
      })
    } else {
      next()
    }
  }
})
export default router
