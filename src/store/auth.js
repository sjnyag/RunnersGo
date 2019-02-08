import api from '../api'

const state = {
  signedIn: false,
  profile: null
}

const apiConfig = {
  apiKey: 'AIzaSyBeGTXxeCc77sTLG81XaryK60i3GKrTTqM',
  clientId:
    '762064213637-np6vfbar65jjc5gderi14kfabred9rcf.apps.googleusercontent.com',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'
  ],
  scope:
    'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.location.read'
}

const actions = {
  initGapi({ commit }) {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', {
        callback: () => {
          window.gapi.client
            .init(apiConfig)
            .then(() => {
              resolve()
            })
            .catch(err => {
              reject(err)
            })
        }
      })
    })
  },
  isSignedIn({ dispatch, commit, state }) {
    return new Promise((resolve, reject) => {
      dispatch('initGapi').then(() => {
        var currentUser = null
        try {
          currentUser = window.gapi.auth2.getAuthInstance().currentUser.get()
        } catch (e) {
          console.log(e)
          resolve(false)
        }

        // not signed in - delete persisted user
        if (!currentUser) {
          console.log('currentUser is undefined.')
          commit('signOut')
          resolve(false)
        }
        // persisted user id same with signed in google user's id
        if (state.profile && state.profile.google_id === currentUser.getId()) {
          commit('signIn')
          resolve(true)
        } else {
          // persisted user id different with signed in google user's id

          console.log(
            "persisted user id different with signed in google user's id."
          )
          console.log(state.profile)
          console.log(currentUser.getId())
          dispatch('signOut').then(() => {
            resolve(false)
          })
        }
      })
    })
  },
  signIn({ dispatch, commit }) {
    console.log('signing in...')
    return new Promise((resolve, reject) => {
      dispatch('initGapi').then(() => {
        window.gapi.auth2
          .getAuthInstance()
          .signIn()
          .then(() => {
            // verify token with a backend server (identify user)
            dispatch('verifyToken')
              .then(profile => {
                commit('signIn', profile)
                resolve()
              })
              .catch(err => {
                dispatch('signOut').then(() => {
                  reject(err)
                })
              })
          })
      })
    })
  },
  signOut({ commit }) {
    console.log('signing out...')
    return new Promise((resolve, reject) => {
      if (
        window.gapi &&
        window.gapi.auth2 &&
        window.gapi.auth2.getAuthInstance()
      ) {
        window.gapi.auth2
          .getAuthInstance()
          .signOut()
          .then(
            () => {
              commit('signOut')
              resolve()
            },
            () => {
              commit('signOut')
              resolve()
            }
          )
      } else {
        commit('signOut')
        resolve()
      }
    })
  },
  // This action verifies the id_token parameter with a backend
  // server and receives the user profile as response
  verifyToken({ commit }) {
    console.log('verifying token...')
    return new Promise((resolve, reject) => {
      var token = null
      var currentUser = null
      try {
        currentUser = window.gapi.auth2.getAuthInstance().currentUser.get()
        token = currentUser.getAuthResponse().id_token
      } catch (e) {
        reject(e)
      }
      if (!token) {
        reject(new Error('Verify error'))
      } else {
        api
          .verify(token)
          .then(res => {
            console.log('token verified', res)
            if (res && res.data && res.data.token_valid) {
              resolve(res.data.profile)
            } else {
              // TODO: Verification
              // reject(new Error('Verify error'))
              resolve({ google_id: currentUser.getId() })
            }
          })
          .catch(err => {
            console.log(err)
            // TODO: Verification
            // reject(err)
            resolve({ google_id: currentUser.getId() })
          })
      }
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
