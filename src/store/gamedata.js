import _ from 'lodash'

const state = {
  profile: {},
  history: {}
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
    return new Promise(resolve => {
      dispatch('firebase/dailySummon', { }, { root: true }).then(result => {
        console.log('daily summon by screen... complete')
        resolve(result)
      })
    })
  }
}

const mutations = {
  saveProfile(state, profile) {
    state.profile = profile
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
