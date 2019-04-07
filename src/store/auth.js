const state = {
  signedIn: false,
  authentication: {}
}

const actions = {
  signIn({ dispatch, commit }) {
    console.log('signing in...')
    return new Promise((resolve, reject) => {
      dispatch('google/signIn', {}, { root: true })
        .then(authentication => {
          dispatch('firebase/signIn', { uid: authentication.id }, { root: true }).then(() => {
            commit('signIn', authentication)
            dispatch('google/sendLatestAuthentication', {}, { root: true }).then(() => {
              dispatch('gameData/saveProfileByAuthentication', authentication, { root: true }).then(() => {
                resolve()
              })
            })
          })
        })
        .catch(err => {
          console.log(err)
          dispatch('signOut').then(() => {
            reject(err)
          })
        })
    })
  },
  signOut({ dispatch, commit }) {
    console.log('signing out...')
    return new Promise(resolve => {
      dispatch('google/signOut', {}, { root: true }).then(() => {
        commit('signOut')
        resolve()
      })
    })
  }
}

const mutations = {
  signIn(state, authentication) {
    state.signedIn = true
    if (authentication) {
      state.authentication = authentication
    }
  },
  signOut(state) {
    state.signedIn = false
    state.authentication = null
  }
}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}
