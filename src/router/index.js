import Vue from 'vue'
import Router from 'vue-router'
import Top from '@/components/Top'
import Login from '@/components/Login'
import Home from '@/components/Home'

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
  if (to.name === 'Top' || to.name === 'Login') {
    next()
  } else {
    if (!window.gapi) {
      next('/')
    } else {
      next()
    }
  }
})
export default router
