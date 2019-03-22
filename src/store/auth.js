import api from '../api'
import axios from 'axios'

const state = {
  signedIn: false,
  profile: {},
  authorization: {},
  clientInitialized: false
}

const apiInitConfig = {
  apiKey: process.env.config.apiKey,
  discoveryDocs: process.env.config.discoveryDocs
}

const apiAuthConfig = {
  clientId: process.env.config.clientId,
  scope: process.env.config.scopes.join(' '),
  prompt: 'consent',
  response_type: 'code id_token permission token',
  access_type: 'offline'
}

const actions = {
  initGapi({ dispatch, commit, state }) {
    console.log('init gapi...')
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('API initialize error'))
      } else {
        if (state.clientInitialized) {
          console.log('init gapi... skip')
          resolve()
        } else {
          window.gapi.load('client:auth2', {
            callback: () => {
              window.gapi.client
                .init(apiInitConfig)
                .then(() => {
                  dispatch('setToken')
                    .then(() => {
                      commit('clientInitialized')
                      resolve()
                    })
                    .catch(() => {
                      resolve()
                    })
                })
                .catch(err => {
                  reject(err)
                })
            }
          })
        }
      }
    })
  },
  setToken({ dispatch, state, commit }) {
    console.log('setting token...')
    return new Promise((resolve, reject) => {
      if (state.authorization && state.authorization.expires_at && state.authorization.code && state.authorization.expires_at < new Date().getTime()) {
        console.log('setting token... use new token')
        dispatch('refreshToken')
          .then(() => {
            resolve()
          })
          .catch(err => {
            reject(err)
          })
      } else if (state.authorization && state.authorization.access_token) {
        console.log('setting token... use existing token')
        window.gapi.client.setToken({ access_token: state.authorization.access_token })
        resolve()
      } else {
        console.log('setting token... no token')
        commit('signOut')
        resolve()
      }
    })
  },
  refreshToken({ state, commit }) {
    console.log('refreshing token...')
    return new Promise((resolve, reject) => {
      axios
        .post(process.env.cloud_function_base_url + 'refreshToken', {
          refresh_token: state.authorization.refresh_token
        })
        .then(response => {
          console.log(response)
          commit('authorize', response.data)
          resolve()
        })
        .catch(err => {
          commit('signOut')
          reject(err)
        })
    })
  },
  signIn({ state, dispatch, commit }) {
    console.log('signing in...')
    return new Promise((resolve, reject) => {
      dispatch('initGapi').then(() => {
        window.gapi.auth2.authorize(apiAuthConfig, response => {
          if (response.error) {
            console.log('signing in... error')
            reject(new Error(response.error))
            return
          }
          commit('authorize', response)
          axios
            .post(process.env.cloud_function_base_url + 'exchangeToken', {
              code: state.authorization.code,
              redirect_uri: location.origin
            })
            .then(response => {
              console.log(response)
              commit('refreshToken', response.data.refresh_token)
              dispatch('setToken').then(() => {
                // verify token with a backend server (identify user)
                dispatch('verifyToken')
                  .then(profile => {
                    commit('signIn', profile)
                    console.log('signing in... success')
                    resolve()
                  })
                  .catch(err => {
                    console.log('signing in... error')
                    dispatch('signOut').then(() => {
                      reject(err)
                    })
                  })
              })
            })
            .catch(err => {
              commit('signOut')
              reject(err)
            })
        })
      })
    })
  },
  signOut({ commit }) {
    console.log('signing out...')
    return new Promise(resolve => {
      commit('signOut')
      resolve()
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
  clientInitialized(state) {
    state.clientInitialized = true
  },
  refreshToken(state, refreshToken) {
    Object.assign(state.authorization, { refresh_token: refreshToken })
  },
  signIn(state, profile) {
    state.signedIn = true
    console.log('mutations.signIn: ', profile)
    if (profile) {
      state.profile = profile
    }
  },
  authorize(state, authorization) {
    console.log('mutations.authorize before: ', state.authorization)
    console.log('mutations.authorize source: ', authorization)
    if (authorization) {
      if (!authorization.expires_at && authorization.expires_in) {
        authorization.expires_at = new Date().getTime() + authorization.expires_in * 1000
      }
      if (state.authorization) {
        authorization = Object.assign(state.authorization, authorization)
      }
      state.authorization = authorization
    }
    console.log('mutations.authorize  after: ', state.authorization)
    if (state.authorization && state.authorization.access_token) {
      window.gapi.client.setToken({ access_token: state.authorization.access_token })
    }
  },
  signOut(state) {
    state.signedIn = false
    state.profile = null
    state.authorization = null
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
