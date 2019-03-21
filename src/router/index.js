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
        title: '',
        hideHeader: true
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        title: 'Login',
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
    if (store.state.auth.signedIn) {
      if (to.name === 'Top' || to.name === 'Login') {
        next('/home')
      } else {
        next()
      }
    } else {
      if (to.name !== 'Login') {
        next('/login')
      } else {
        next()
      }
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
