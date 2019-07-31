const functions = require('firebase-functions')
const cors = require('cors')({ origin: true })
const axios = require('axios')
const admin = require('firebase-admin')
const _ = require('lodash')
const express = require('express')
const cookieParser = require('cookie-parser')()
const moment = require('moment')

class AlreadySummonedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AlreadySummonedError'
  }
}

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

const MONSTERS = {
  1: { no: 1, rarity: 2, url: 'Amazons.png', name: 'アマゾネス' },
  2: { no: 2, rarity: 1, url: 'Dwarf.png', name: 'ドワーフ' },
  3: { no: 3, rarity: 2, url: 'Ettin.png', name: 'エティン' },
  4: { no: 4, rarity: 1, url: 'Ghast.png', name: 'ガスト' },
  5: { no: 5, rarity: 2, url: 'Kelpie.png', name: 'ケルピー' },
  6: { no: 6, rarity: 1, url: 'Kobold.png', name: 'コボルド' },
  7: { no: 7, rarity: 1, url: 'Yeti.png', name: 'イエティ' }
}
/**
 * # Routing
 * - /
 *   - /createCusomToken
 *   - /exchangeGapiToken
 *   - /refreshGapiToken
 *   - /exchangeGapiToken
 * - /user
 *   - /user/dailySummon
 *   - /user/allMonsters
 *   - /user/activities
 *
 *
 * # Functions
 * - saveActivitySummary
 * - execGApi
 *     - resolveGApiHeader
 *       - updateGoogleApiTokenIfNeed
 * - validateFirebaseIdToken
 */
const validateFirebaseIdToken = (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token')

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) && !(req.cookies && req.cookies.__session)) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    )
    res.status(403).send('Unauthorized')
    return
  }

  let idToken
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header')
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else if (req.cookies) {
    console.log('Found "__session" cookie')
    // Read the ID Token from cookie.
    idToken = req.cookies.__session
  } else {
    // No cookie
    res.status(403).send('Unauthorized')
    return
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log('ID Token correctly decoded', decodedIdToken)
      req.user = decodedIdToken
      return next()
    })
    .catch(error => {
      console.error('Error while verifying Firebase ID token:', error)
      res.status(403).send('Unauthorized')
    })
}

const updateGoogleApiTokenIfNeed = (auth, uid) => {
  const needsUpdate = auth => {
    return auth.expires_at && auth.code && auth.expires_at < new Date().getTime()
  }
  if (!needsUpdate(auth)) {
    return new Promise(resolve => {
      resolve(auth)
    })
  }
  console.log('use new token')
  return new Promise(resolve => {
    axios({
      method: 'POST',
      url: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      data: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        refresh_token: auth.refresh_token,
        grant_type: 'refresh_token'
      }
    }).then(axiosResponse => {
      console.log(axiosResponse.data)
      if (!axiosResponse.data.expires_at && axiosResponse.data.expires_in) {
        axiosResponse.data.expires_at = new Date().getTime() + axiosResponse.data.expires_in * 1000
      }
      const db = admin.firestore()
      const authRef = db
        .collection('users')
        .doc(uid)
        .collection('authentication')
        .doc('google')
      return db
        .runTransaction(transaction => {
          // This code may get re-run multiple times if there are conflicts.
          return transaction.get(authRef).then(() => {
            transaction.set(authRef, axiosResponse.data, { merge: true })
          })
        })
        .then(() => {
          resolve(axiosResponse.data)
        })
    })
  })
}

const resolveGApiHeader = uid => {
  return new Promise(resolve => {
    admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('authentication')
      .doc('google')
      .get()
      .then(existingAuthResult => {
        const auth = existingAuthResult.data()
        updateGoogleApiTokenIfNeed(auth, uid).then(newAuth => {
          resolve({
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + newAuth.access_token
            }
          })
        })
      })
  })
}

const execGApi = (uid, request) => {
  return new Promise(resolve => {
    resolveGApiHeader(uid).then(header => {
      axios(Object.assign(header, request)).then(axiosResponse => {
        resolve(axiosResponse.data)
      })
    })
  })
}

const saveActivitySummary = (uid, activities) => {
  if (_.isEmpty(activities)) {
    return new Promise(resolve => {
      resolve([])
    })
  }
  _.each(activities, activity => {
    admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('gameData')
      .doc('activities')
      .collection('fitActivity')
      .doc(activity.endTimeNanos)
      .set(activity.toData())
  })
  admin
    .firestore()
    .collection('users')
    .doc(uid)
    .set({ latests: { lastDateOfActivitySummary: _.last(activities).endTimeNanos } }, { merge: true })
  return new Promise(resolve => {
    resolve(activities)
  })
}

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp({
  credential: admin.credential.cert(functions.config().service_account),
  databaseURL: 'https://runnersgo.firebaseio.com/'
})

exports.createCustomToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    return admin
      .auth()
      .createCustomToken(request.body.uid)
      .then(customToken => {
        console.log(`The customToken is: ${customToken}`)
        return response.status(200).json({ customToken: customToken })
      })
      .catch(error => {
        console.error(`Something happened buddy: ${error}`)
        return response.status(500).json({
          message: error
        })
      })
  })
})

exports.exchangeGapiToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    axios({
      method: 'POST',
      url: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      data: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        code: request.body.code,
        grant_type: 'authorization_code',
        redirect_uri: request.body.redirect_uri
      }
    })
      .then(axiosResponse => {
        console.log(axiosResponse.data)
        return response.status(200).json(axiosResponse.data)
      })
      .catch(err => {
        console.log(err)
        return response.status(500).json({
          message: err
        })
      })
  })
})

exports.refreshGapiToken = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== 'POST') {
      return response.status(401).json({
        message: 'Not allowed'
      })
    }
    axios({
      method: 'POST',
      url: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      data: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        refresh_token: request.body.refresh_token,
        grant_type: 'refresh_token'
      }
    })
      .then(axiosResponse => {
        console.log(axiosResponse.data)
        return response.status(200).json(axiosResponse.data)
      })
      .catch(err => {
        console.log(err)
        return response.status(500).json({
          message: err
        })
      })
  })
})
const users = express()
users.use(cors)
users.use(cookieParser)
users.use(validateFirebaseIdToken)
users.use((_, response, next) => {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
users.post('/dailySummon', (request, response) => {
  const db = admin.firestore()
  const userRef = db.collection('users').doc(request.user.uid)
  return db
    .runTransaction(transaction => {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(userRef).then(user => {
        if (user.exists && user.data().latests && user.data().latests.lastDateOfDailySummon) {
          const lastDate = new Date(user.data().latests.lastDateOfDailySummon + 1000 * 60 * 60 * 9)
          const toDateNumber = date => {
            return date.getFullYear() * 10000 + date.getUTCMonth() * 100 + date.getUTCDate()
          }
          if (toDateNumber(lastDate) >= toDateNumber(new Date())) {
            throw new AlreadySummonedError('Already summoned today!')
          }
        }
        transaction.set(userRef, { latests: { lastDateOfDailySummon: new Date().getTime() } }, { merge: true })
      })
    })
    .then(() => {
      let no = Math.floor(Math.random() * 10)
      if (!(no in MONSTERS)) {
        no = 2
      }
      const monster = MONSTERS[no]
      admin
        .firestore()
        .collection('users')
        .doc(request.user.uid)
        .collection('gameData')
        .doc('monsters')
        .collection('summoned')
        .doc(new Date().getTime().toString())
        .set(monster)
      return monster
    })
    .then(monster => {
      return response.status(200).json(monster)
    })
    .catch(error => {
      console.log('Error getting document:', error)
      if (error instanceof AlreadySummonedError) {
        return response.status(500).json({ type: 'AlreadySummonedError', message: error })
      } else {
        return response.status(500).json({ type: 'UnknownError', message: error })
      }
    })
})
users.post('/allMonsters', (request, response) => {
  admin
    .firestore()
    .collection('users')
    .doc(request.user.uid)
    .collection('gameData')
    .doc('monsters')
    .collection('summoned')
    .get()
    .then(querySnapshot => {
      const result = []
      querySnapshot.forEach(doc => {
        result.push(doc.data())
      })
      return response.status(200).json(result)
    })
    .catch(error => {
      console.log('Error getting document:', error)
      return response.status(500).json({ type: 'UnknownError', message: error })
    })
})
users.post('/activities', (request, response) => {
  _.each(request.body.dailyActivities, (activities, date) => {
    _.each(activities, activity => {
      admin
        .firestore()
        .collection('users')
        .doc(request.user.uid)
        .collection('gameData')
        .doc('activities')
        .collection(date)
        .doc(activity.startTimeNanos)
        .set(activity)
    })
  })
  return response.status(200).json(request.dailyActivities)
})
users.get('/activities', (request, response) => {
  const start = DateUtil.toMoment(request.body.startTimeNanos)
  const end = DateUtil.toMoment(request.body.endTimeNanos)

  const gapiPromise = gapiRequest => {
    return new Promise(resolve => {
      execGApi(request.user.uid, gapiRequest).then(axiosResponse => {
        resolve(axiosResponse)
      })
    })
  }
  new Aggregator(gapiPromise).run(start, end).then(results => {
    saveActivitySummary(request.user.uid, results).then(() => {
      admin
        .firestore()
        .collection('users')
        .doc(request.user.uid)
        .collection('gameData')
        .doc('activities')
        .collection('fitActivity')
        .where('startTimeNanos', '>=', request.body.startTimeNanos.toString())
        .where('startTimeNanos', '<', request.body.endTimeNanos.toString())
        .orderBy('startTimeNanos', 'desc')
        .get()
        .then(querySnapshot => {
          const result = {}
          querySnapshot.forEach(doc => {
            const date =
              moment(doc.id / (1000 * 1000))
                .utc()
                .startOf('day')
                .unix() * 1000
            if (!result.hasOwnProperty(date)) {
              result[date] = []
            }
            result[date].push(doc.data())
          })
          return response.status(200).json(result)
        })
        .catch(error => {
          console.log('Error getting document:', error)
          return response.status(500).json({ type: 'UnknownError', message: error })
        })
    })
  })
})
// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.users = functions.https.onRequest(users)
