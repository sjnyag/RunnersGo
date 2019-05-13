import _ from 'lodash'

const state = {
  profile: {},
  history: {},
  lastDateOfDailySummon: null
}

const actions = {
  saveProfileByAuthentication({ dispatch, commit, state }, authentication) {
    console.log('saveing profile by authentication...')
    return new Promise(resolve => {
      const profile = _.merge(authentication, state.profile)
      dispatch('firebase/saveGameData', { doc: 'profile', data: profile }, { root: true }).then(() => {
        commit('saveProfile', profile)
        console.log('saveing profie by authentication... complete')
        resolve()
      })
    })
  },
  dailySummon({ dispatch }) {
    console.log('daily summon by screen...')
    return new Promise((resolve, reject) => {
      dispatch('firebase/dailySummon', {}, { root: true })
        .then(result => {
          console.log('daily summon by screen... complete')
          resolve(result)
        })
        .catch(error => {
          console.log('daily summon by screen... error')
          reject(error)
        })
    })
  },
  isEnableDailySummon({ state }) {
    console.log('check if enable to summon today...')
    return new Promise(resolve => {
      let result = true
      if (state.lastDateOfDailySummon) {
        const lastDate = new Date(state.lastDateOfDailySummon + 1000 * 60 * 60 * 9)
        const toDateNumber = date => {
          return date.getFullYear() * 10000 + date.getUTCMonth() * 100 + date.getUTCDate()
        }
        result = toDateNumber(lastDate) < toDateNumber(new Date())
      }
      console.log('check if enable to summon today...', result)
      resolve(result)
    })
  },
  allMonsters({ dispatch }) {
    console.log('all monsters...')
    return new Promise((resolve, reject) => {
      dispatch('firebase/allMonsters', {}, { root: true })
        .then(result => {
          console.log('all monsters... complete')
          resolve(result)
        })
        .catch(error => {
          console.log('all monsters... error')
          reject(error)
        })
    })
  },
  activities({ dispatch }, request) {
    console.log('read activities...')
    return new Promise((resolve, reject) => {
      dispatch('firebase/activities', request, { root: true })
        .then(result => {
          console.log('read activities... complete')
          resolve(result)
        })
        .catch(error => {
          console.log('read activities... error')
          reject(error)
        })
    })
  }
}

const mutations = {
  saveProfile(state, profile) {
    state.profile = profile
  },
  dailySummon(state, now) {
    state.lastDateOfDailySummon = now
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
