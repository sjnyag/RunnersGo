import _ from 'lodash'
import moment from 'moment'

const state = {
  profile: {},
  history: {},
  dailyFitActivities: {},
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
  activities({ dispatch, state, commit }, request) {
    console.log('read activities...')
    let start = request.startMoment.unix() * 1000
    let end = request.endMoment.unix() * 1000
    foreachByDateDesc(start, end, date => {
      start = date
      return state.dailyFitActivities.hasOwnProperty(date)
    })
    foreachByDateAsc(end, start, date => {
      end = date
      return state.dailyFitActivities.hasOwnProperty(date)
    })
    return new Promise((resolve, reject) => {
      const resolveActivitiesByCache = data => {
        let result = []
        const dailyResult = {}
        foreachByDateDesc(request.startMoment.unix() * 1000, request.endMoment.unix() * 1000, date => {
          dailyResult[date] = state.dailyFitActivities[date]
          if (!dailyResult[date]) {
            dailyResult[date] = data[date]
          }
          return true
        })
        _.forEach(dailyResult, (sessions, _) => {
          if (sessions) {
            result = result.concat(sessions)
          }
        })
        console.log('read activities... complete')
        resolve(result)
      }
      if (start === end) {
        resolveActivitiesByCache()
      } else {
        dispatch('firebase/activities', { startTimeNanos: start * 1000 * 1000, endTimeNanos: end * 1000 * 1000 }, { root: true })
          .then(result => {
            commit('saveDailyFitActivities', { result: result.data, start: start, end: end })
            resolveActivitiesByCache(result.data)
          })
          .catch(error => {
            console.log('read activities... error')
            reject(error)
          })
      }
    })
  }
}

const foreachByDateDesc = (start, end, proc) => {
  if (start < end) {
    const temp = start
    start = end
    end = temp
  }
  let current = start
  while (current >= end) {
    if (!proc(current)) {
      break
    }
    current =
      moment(current)
        .subtract(1, 'days')
        .unix() * 1000
  }
}

const foreachByDateAsc = (start, end, proc) => {
  if (start > end) {
    const temp = start
    start = end
    end = temp
  }
  let current = start
  while (current <= end) {
    if (!proc(current)) {
      break
    }
    current =
      moment(current)
        .add(1, 'days')
        .unix() * 1000
  }
}

const mutations = {
  saveProfile(state, profile) {
    state.profile = profile
  },
  dailySummon(state, now) {
    state.lastDateOfDailySummon = now
  },
  saveDailyFitActivities(state, payload) {
    const yesterday = moment(new Date())
      .utc()
      .subtract(1, 'days')
      .startOf('day')
    foreachByDateAsc(payload.end, payload.start, date => {
      if (date >= yesterday) {
        return true
      }
      if (!payload.result.hasOwnProperty(date)) {
        state.dailyFitActivities[date] = []
      } else {
        state.dailyFitActivities[date] = payload.result[date]
      }
      return true
    })
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
