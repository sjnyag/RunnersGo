import api from '../api'

const state = {
  signedIn: false,
  profile: {}
}

const actions = {
  signIn({ dispatch, commit }) {
    console.log('signing in...')
    return new Promise((resolve, reject) => {
      dispatch('google/signIn', {}, { root: true })
        .then(profile => {
          dispatch('firebase/signIn', { uid: profile.id }, { root: true }).then(() => {
            // verify token with a backend server (identify user)
            dispatch('verifyToken').then(() => {
              commit('signIn', profile)
              resolve()
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
  },
  // This action verifies the id_token parameter with a backend
  // server and receives the user profile as response
  verifyToken() {
    console.log('verifying token...')
    return new Promise((resolve, reject) => {
      window.gapi.client.oauth2.userinfo
        .get()
        .then(userInfo => {
          api
            .verify(userInfo.result)
            .then(response => {
              console.log('token verified', response)
              if (response && response.data && response.data.token_valid) {
                resolve(response.data.profile)
              } else {
                // TODO: Verification
                resolve(userInfo.result)
              }
            })
            .catch(err => {
              console.log(err)
              // TODO: Verification
              // reject(err)
              resolve(userInfo.result)
            })
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

const mutations = {
  signIn(state, profile) {
    state.signedIn = true
    if (profile) {
      state.profile = profile
    }
  },
  signOut(state) {
    state.signedIn = false
    state.profile = null
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
