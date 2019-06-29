import _ from 'lodash'
import moment from 'moment'
import axios from 'axios'

var DateUtil = class {
  static diffSecondNanos(startTimeNanos, endTimeNanos) {
    return DateUtil.toMoment(endTimeNanos).diff(DateUtil.toMoment(startTimeNanos), 'seconds', true)
  }
  static toMoment(nano) {
    return moment(new Date(parseInt(nano) / 1000000))
  }
  static formatNanos(nano, format) {
    return DateUtil.toMoment(nano).format(format)
  }
}
var Activity = class {
  static get LABEL() {
    return {
      0: 'In vehicle*',
      3: 'Still (not moving)*',
      8: 'Running*',
      7: 'Walking*'
    }
  }
  constructor(type, startTimeNanos, endTimeNanos) {
    this.type = type
    this.startTimeNanos = startTimeNanos
    this.endTimeNanos = endTimeNanos
    this.detail = {}
  }
  isShortRest() {
    const diffSeconds = DateUtil.diffSecondNanos(this.startTimeNanos, this.endTimeNanos)
    return this.type === 3 && diffSeconds < 60 * 5
  }
  shouldShow() {
    return (this.type === 7 || this.type === 8) && DateUtil.diffSecondNanos(this.startTimeNanos, this.endTimeNanos) > 60 * 5
  }
  shouldMerge(activity) {
    return activity.isShortRest() || activity.type === this.type
  }
  merge(activity) {
    this.endTimeNanos = activity.endTimeNanos
  }
  toData() {
    return {
      distance: this.detail.distance,
      stepCount: this.detail.stepCount,
      startTimeNanos: this.startTimeNanos,
      endTimeNanos: this.endTimeNanos,
      type: this.type,
      seconds: DateUtil.diffSecondNanos(this.startTimeNanos, this.endTimeNanos)
    }
  }
  dump() {
    return (
      DateUtil.formatNanos(this.startTimeNanos, 'YYYY/MM/DD(ddd) HH:mm:ss') +
      ' ~ ' +
      DateUtil.formatNanos(this.endTimeNanos, 'HH:mm:ss') +
      ' (' +
      DateUtil.diffSecondNanos(this.startTimeNanos, this.endTimeNanos) +
      ' sec.)' +
      ' : ' +
      Activity.LABEL[this.type] +
      ' ' +
      this.detail.distance +
      'm / ' +
      this.detail.stepCount +
      'steps'
    )
  }
}
var Aggregator = class {
  static get BASE_URL() {
    return 'https://www.googleapis.com/fitness/v1/users/me/'
  }
  static get DATA_SOURCES() {
    return {
      active_minutes: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
      estimated_steps: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      aggregate: 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments',
      locationSamples: 'derived:com.google.location.sample:com.google.android.gms:merge_location_samples'
    }
  }
  constructor(gapiPromise) {
    this.gapiPromise = gapiPromise
  }
  dataSetId(start, end) {
    return start.unix() * 1000 * 1000 * 1000 + '-' + end.unix() * 1000 * 1000 * 1000
  }
  run(start, end) {
    const url = Aggregator.BASE_URL + 'dataSources/' + Aggregator.DATA_SOURCES['aggregate'] + '/datasets/' + this.dataSetId(start, end)
    return new Promise((resolve, reject) =>
      this.gapiPromise({ method: 'GET', url: url })
        .then(response => {
          const results = []
          _.each(response.point, point => {
            if (!point.value.hasOwnProperty('length') || point.value.length !== 1) {
              return
            }
            const activity = new Activity(point.value[0].intVal, point.startTimeNanos, point.endTimeNanos)
            const lastActivity = _.last(results)
            if (lastActivity && lastActivity.shouldMerge(activity)) {
              lastActivity.merge(activity)
            } else {
              results.push(activity)
            }
          })
          return results
        })
        .then(results => {
          const promises = []
          _.each(results, activity => {
            if (activity.shouldShow()) {
              promises.push(
                this.aggregateDetail(DateUtil.toMoment(activity.startTimeNanos), DateUtil.toMoment(activity.endTimeNanos)).then(detail => {
                  return new Promise(resolve => {
                    activity.detail = detail
                    resolve(activity)
                  })
                })
              )
            }
          })
          Promise.all(promises).then(results => {
            resolve(results)
          })
        })
        .catch(err => {
          reject(err)
        })
    )
  }
  aggregateDetail(start, end) {
    const url = Aggregator.BASE_URL + 'dataset:aggregate'
    const request = {
      aggregateBy: [
        {
          dataTypeName: 'com.google.distance.delta'
        },
        {
          dataTypeName: 'com.google.step_count.delta'
        }
      ],
      bucketByTime: { durationMillis: 60000 },
      startTimeMillis: start.subtract(2, 'minutes').unix() * 1000,
      endTimeMillis: end.add(2, 'minutes').unix() * 1000
    }
    return new Promise((resolve, reject) =>
      this.gapiPromise({ method: 'POST', url: url, data: request })
        .then(response => {
          if (response.bucket.length === 0) {
            resolve({})
          } else {
            let startTime = null
            let endTime = null
            let distance = null
            let stepCount = null
            _.each(response.bucket, bucket => {
              if (bucket.dataset[0].point.length > 0) {
                const distanceData = bucket.dataset[0].point[0]
                if (startTime === null) {
                  startTime = distanceData.startTimeNanos
                }
                endTime = distanceData.endTimeNanos
                distance += distanceData.value[0].fpVal
              }
              if (bucket.dataset[1].point.length > 0) {
                const dstepCountData = bucket.dataset[1].point[0]
                if (startTime === null) {
                  startTime = dstepCountData.startTimeNanos
                }
                endTime = dstepCountData.endTimeNanos
                stepCount += dstepCountData.value[0].intVal
              }
            })
            resolve({
              startTimeNanos: startTime,
              endTimeNanos: endTime,
              distance: Math.round(distance),
              stepCount: Math.round(stepCount)
            })
          }
        })
        .catch(err => {
          reject(err)
        })
    )
  }
}

const state = {}

const actions = {
  activities({ rootState, dispatch }, request) {
    console.log('read activities by gapi...')
    const start = DateUtil.toMoment(request.startTimeNanos)
    const end = DateUtil.toMoment(request.endTimeNanos)
    const gapiPromise = request => {
      return new Promise(resolve => {
        axios(Object.assign({ headers: { Authorization: 'Bearer ' + rootState.google.authorization.access_token } }, request))
          .then(axiosResponse => {
            resolve(axiosResponse.data)
          })
          .catch(error => {
            if (error.response.status === 401) {
              dispatch('google/initialize', {}, { root: true }).then(() => {
                axios(Object.assign({ headers: { Authorization: 'Bearer ' + rootState.google.authorization.access_token } }, request)).then(axiosResponse => {
                  resolve(axiosResponse.data)
                })
              })
            }
          })
      })
    }
    return new Promise(resolve => {
      new Aggregator(gapiPromise).run(start, end).then(activities => {
        const result = {}
        activities.forEach(activity => {
          const date =
            moment(activity.endTimeNanos / (1000 * 1000))
              .utc()
              .startOf('day')
              .unix() * 1000
          if (!result.hasOwnProperty(date)) {
            result[date] = []
          }
          result[date].push(activity.toData())
        })
        resolve({data: result})
      })
    })
  }
}

const mutations = {}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}
