import axios from 'axios'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/messaging'
import 'firebase/firestore'

const state = {
  clientInitialized: false,
  tokenSentToServer: false,
  messagingInitialized: false
}

const actions = {
  initialize({ commit, state }) {
    console.log('init firebase...')
    return new Promise(resolve => {
      if (state.clientInitialized) {
        console.log('init firebase... skip')
        resolve()
      } else {
        firebase.initializeApp({ ...process.env.config, apiKey: process.env.API_KEY })
        commit('clientInitialized')
        console.log('init firebase... complete')
        resolve()
      }
    })
  },
  initMessaging({ commit, dispatch, state }) {
    console.log('init messaging...')
    return new Promise(resolve => {
      if (state.messagingInitialized) {
        console.log('init messaging... skip')
        resolve()
      } else {
        dispatch('initialize').then(() => {
          firebase.messaging().usePublicVapidKey(process.env.public_valid_key)
          firebase.messaging().onTokenRefresh(() => {
            commit('setTokenSentToServer', false)
            dispatch('registerMessagingToken')
          })
          firebase.messaging().onMessage(payload => {
            console.log('Message receiver ', payload)
            console.log('Notification: ', payload.notification)
          })
          commit('messagingInitialized')
          console.log('init messaging... complete')
          resolve()
        })
      }
    })
  },
  requestMessagingPermission({ dispatch }) {
    console.log('request messaging permission...')
    return new Promise(resolve => {
      dispatch('initMessaging').then(() => {
        firebase
          .messaging()
          .requestPermission()
          .then(() => {
            console.log('Notification permission granted.')
            dispatch('registerMessagingToken').then(() => {
              resolve()
            })
          })
      })
    })
  },
  registerMessagingToken({ dispatch, rootState, commit }) {
    console.log('register messaging token...')
    return new Promise((resolve, reject) => {
      if (!rootState.auth.authentication.id) {
        console.log('register messaging token... skip')
        resolve()
      } else {
        dispatch('initMessaging').then(() => {
          firebase
            .messaging()
            .getToken()
            .then(currentToken => {
              if (currentToken) {
                commit('setTokenSentToServer', false)
                dispatch('sendMessageTokenToServer', currentToken).then(() => {
                  console.log('register messaging token... success')
                  resolve()
                })
              } else {
                console.log('No Instance ID token available. Request permission to generate one.')
                commit('setTokenSentToServer', false)
                reject(new Error('No Instance ID token available. Request permission to generate one.'))
              }
            })
            .catch(err => {
              console.log('An error occurred while retrieving token. ', err)
              commit('setTokenSentToServer', false)
              reject(err)
            })
        })
      }
    })
  },
  save({ dispatch, rootState }, data) {
    console.log('firebase data saving...')
    return new Promise((resolve, reject) => {
      dispatch('initialize').then(() => {
        firebase
          .firestore()
          .collection('users')
          .doc(rootState.auth.authentication.id)
          .collection(data.name)
          .doc(data.doc)
          .set(data.data, { merge: true })
          .then(() => {
            console.log('firebase data saving... success')
            resolve()
          })
          .catch(error => {
            console.error('Error adding document: ', error)
            reject(error)
          })
      })
    })
  },
  saveGameData({ dispatch }, data) {
    return new Promise(resolve => {
      dispatch('save', { ...data, name: 'gameData' }).then(() => {
        resolve()
      })
    })
  },
  saveAuthenticationData({ dispatch }, data) {
    return new Promise(resolve => {
      dispatch('save', { ...data, name: 'authentication' }).then(() => {
        resolve()
      })
    })
  },
  sendMessageTokenToServer({ dispatch, commit }, currentToken) {
    console.log('upload messaging token...')
    return new Promise((resolve, reject) => {
      dispatch('saveAuthenticationData', { doc: 'push', data: { token: currentToken } })
        .then(() => {
          console.log('upload messaging token... success')
          commit('setTokenSentToServer', true)
          resolve()
        })
        .catch(error => {
          console.error('Error adding document: ', error)
          reject(error)
        })
    })
  },
  signIn({ dispatch }, request) {
    console.log('signing in to firebase...')
    return new Promise(resolve => {
      dispatch('initialize').then(() => {
        axios.post(process.env.cloud_function_base_url + 'createCustomToken', request).then(response => {
          firebase
            .auth()
            .signInWithCustomToken(response.data.customToken)
            .then(() => {
              console.log('signing in to firebase... success')
              resolve()
            })
        })
      })
    })
  }
}

const mutations = {
  clientInitialized(state) {
    state.clientInitialized = true
  },
  messagingInitialized(state) {
    state.messagingInitialized = true
  },
  setTokenSentToServer(state, status) {
    state.tokenSentToServer = status
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
