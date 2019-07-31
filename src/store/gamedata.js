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
    let start = toUtcDate(request.startDate)
    let end = toUtcDate(request.endDate)
    foreachByDateDesc(end, start, date => {
      end = date
      return state.dailyFitActivities.hasOwnProperty(date.unix() * 1000)
    })
    foreachByDateAsc(start, end, date => {
      start = date
      return state.dailyFitActivities.hasOwnProperty(date.unix() * 1000)
    })
    return new Promise((resolve, reject) => {
      const resolveActivitiesByCache = data => {
        let result = []
        const dailyResult = {}
        foreachByDateDesc(toUtcDate(request.endDate), toUtcDate(request.startDate), date => {
          dailyResult[date.unix()] = state.dailyFitActivities[date.unix() * 1000]
          if (!dailyResult[date.unix()]) {
            dailyResult[date.unix()] = data[date.unix() * 1000]
          }
          return true
        })
        _.forEach(dailyResult, (sessions, _) => {
          if (sessions) {
            result = result.concat(sessions)
          }
        })
        result = _.sortBy(result, [
          r => {
            return r.startDate
          }
        ]).reverse()
        dispatch(
          'firebase/saveActivities',
          {
            dailyActivities: dailyResult
          },
          { root: true }
        ).then(() => {
          console.log('read activities... complete')
          resolve(result)
        })
      }
      if (start === end) {
        resolveActivitiesByCache([])
      } else {
        dispatch(
          'fit/activities',
          {
            startTimeNanos: start.unix() * 1000 * 1000 * 1000,
            endTimeNanos:
              end
                .clone()
                .add(1, 'days')
                .unix() *
              1000 *
              1000 *
              1000
          },
          { root: true }
        )
          .then(result => {
            commit('saveDailyFitActivities', { result: result.data, start: start.clone(), end: end.clone() })
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

const toUtcDate = momentDate => {
  return momentDate
    .clone()
    .utc()
    .startOf('day')
}

const foreachByDateDesc = (start, end, proc) => {
  let current = start.clone()
  while (current >= end) {
    if (!proc(current)) {
      break
    }
    current = current.subtract(1, 'days')
  }
}

const foreachByDateAsc = (start, end, proc) => {
  let current = start.clone()
  while (current <= end) {
    if (!proc(current)) {
      break
    }
    current = current.add(1, 'days')
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
      .subtract(1, 'days')
      .utc()
      .startOf('day')
    foreachByDateAsc(payload.start, payload.end, date => {
      if (date > yesterday) {
        return true
      }
      const unixJs = date.unix() * 1000
      if (!payload.result.hasOwnProperty(unixJs)) {
        state.dailyFitActivities[unixJs] = []
      } else {
        state.dailyFitActivities[unixJs] = payload.result[unixJs]
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
