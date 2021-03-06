import axios from 'axios'

const state = {
  authorization: {},
  clientInitialized: false
}

const apiInitConfig = {
  apiKey: process.env.API_KEY,
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
  initialize({ dispatch, commit, state }) {
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
                  commit('clientInitialized')
                  dispatch('setToken')
                    .then(() => {
                      console.log('init gapi... complete')
                      resolve()
                    })
                    .catch(() => {
                      console.log('init gapi... complete')
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
  setToken({ dispatch, state }) {
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
        reject(new Error('No token'))
      }
    })
  },
  refreshToken({ state, dispatch, commit }) {
    console.log('refreshing token...')
    return new Promise((resolve, reject) => {
      axios
        .post(process.env.cloud_function_base_url + 'refreshGapiToken', {
          refresh_token: state.authorization.refresh_token
        })
        .then(response => {
          console.log(response)
          commit('authorize', response.data)
          dispatch('sendLatestAuthentication').then(() => {
            resolve()
          })
        })
        .catch(err => {
          commit('signOut')
          reject(err)
        })
    })
  },
  sendLatestAuthentication({ dispatch, state }) {
    console.log('sending latest authentication...')
    return new Promise(resolve => {
      dispatch('firebase/saveAuthenticationData', { doc: 'google', data: state.authorization }, { root: true }).then(() => {
        console.log('sending latest authentication... success')
        resolve()
      })
    })
  },
  signIn({ state, dispatch, commit }) {
    console.log('signing in to google...')
    return new Promise((resolve, reject) => {
      dispatch('initialize').then(() => {
        window.gapi.auth2.authorize(apiAuthConfig, response => {
          if (response.error) {
            console.log('signing in to google... error')
            reject(new Error(response.error))
            return
          }
          commit('authorize', response)
          axios
            .post(process.env.cloud_function_base_url + 'exchangeGapiToken', {
              code: state.authorization.code,
              redirect_uri: location.origin
            })
            .then(response => {
              commit('refreshToken', response.data.refresh_token)
              dispatch('setToken').then(() => {
                window.gapi.client.oauth2.userinfo.get().then(response => {
                  console.log('signing in to google... complete')
                  resolve(response.result)
                })
              })
            })
            .catch(err => {
              reject(err)
            })
        })
      })
    })
  },
  signOut({ commit }) {
    console.log('signing out from google...')
    return new Promise(resolve => {
      commit('signOut')
      resolve()
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
  authorize(state, authorization) {
    if (authorization) {
      if (!authorization.expires_at && authorization.expires_in) {
        authorization.expires_at = new Date().getTime() + authorization.expires_in * 1000
      }
      if (state.authorization) {
        authorization = Object.assign(state.authorization, authorization)
      }
      state.authorization = authorization
    }
    if (state.authorization && state.authorization.access_token) {
      window.gapi.client.setToken({ access_token: state.authorization.access_token })
    }
  },
  signOut(state) {
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
