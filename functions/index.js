const functions = require('firebase-functions')
const cors = require('cors')({ origin: true })
const rp = require('request-promise')
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
 * - summaryActivity
 *   - aggregateFitnessDataSet
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
    rp({
      method: 'POST',
      uri: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      json: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        refresh_token: auth.refresh_token,
        grant_type: 'refresh_token'
      }
    }).then(response => {
      console.log(response)
      if (!response.expires_at && response.expires_in) {
        response.expires_at = new Date().getTime() + response.expires_in * 1000
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
            transaction.set(authRef, response, { merge: true })
          })
        })
        .then(() => {
          resolve(response)
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
      rp(Object.assign(header, request)).then(data => {
        resolve(data)
      })
    })
  })
}

const aggregateFitnessDataSet = (uid, activity) => {
  const nanoStringToMoment = nano => {
    return moment(new Date(parseInt(nano) / 1000000))
  }
  const aggregateRequest = {
    method: 'POST',
    uri: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    json: {
      aggregateBy: [
        {
          dataTypeName: 'com.google.distance.delta'
        },
        {
          dataTypeName: 'com.google.step_count.delta'
        }
      ],
      bucketByTime: { durationMillis: 60000 },
      startTimeMillis:
        nanoStringToMoment(activity.summary.startTimeNanos)
          .subtract(2, 'minutes')
          .unix() * 1000,
      endTimeMillis:
        nanoStringToMoment(activity.summary.endTimeNanos)
          .add(2, 'minutes')
          .unix() * 1000
    },
    timeout: 30 * 1000
  }
  return new Promise((resolve, reject) => {
    execGApi(uid, aggregateRequest)
      .then(result => {
        if (result.bucket.length === 0) {
          resolve({})
        } else {
          let startTime = null
          let endTime = null
          let distance = null
          let stepCount = null
          _.each(result.bucket, bucket => {
            if (bucket.dataset[0].point.length > 0) {
              if (startTime === null) {
                startTime = bucket.dataset[0].point[0].startTimeNanos
              }
              endTime = bucket.dataset[0].point[0].endTimeNanos
              distance += bucket.dataset[0].point[0].value[0].fpVal
            }
            if (bucket.dataset[1].point.length > 0) {
              if (startTime === null) {
                startTime = bucket.dataset[1].point[0].startTimeNanos
              }
              endTime = bucket.dataset[1].point[0].endTimeNanos
              stepCount += bucket.dataset[1].point[0].value[0].intVal
            }
          })
          activity.aggregated = {
            startTimeNanos: startTime,
            endTimeNanos: endTime,
            distance: Math.round(distance),
            stepCount: Math.round(stepCount)
          }
          resolve(activity)
        }
      })
      .catch(error => {
        reject(error)
      })
  })
}

const summaryActivity = (uid, response) => {
  const isContinuous = (before, after) => {
    // Points within 15 minutes are the same activity
    return (after - before) / (1000 * 1000 * 1000) < 15 * 60
  }
  const isNotShortSession = summary => {
    // A activity needs to have points over 5 minutes
    return (summary.endTimeNanos - summary.startTimeNanos) / (1000 * 1000 * 1000) > 5 * 60
  }
  const hasEnoughDistance = aggregated => {
    // A activity needs to have points over 5 meters
    return aggregated.distance > 500
  }
  return new Promise(resolve => {
    let before = 0
    let results = []
    response.point.forEach(point => {
      if (isContinuous(before, point.startTimeNanos)) {
        _.last(results).summary.endTimeNanos = point.endTimeNanos
      } else {
        point.summary = {
          startTimeNanos: point.startTimeNanos,
          endTimeNanos: point.endTimeNanos
        }
        results.push(point)
      }
      before = point.endTimeNanos
    })
    const promises = []
    _.each(_.filter(results, point => isNotShortSession(point.summary)), activity => {
      promises.push(aggregateFitnessDataSet(uid, activity))
    })
    Promise.all(promises).then(results => {
      resolve(_.filter(results, point => hasEnoughDistance(point.aggregated)))
    })
  })
}

const saveActivitySummary = (request, activities) => {
  if (_.isEmpty(activities)) {
    return new Promise(resolve => {
      resolve([])
    })
  }
  _.each(activities, activity => {
    admin
      .firestore()
      .collection('users')
      .doc(request.user.uid)
      .collection('gameData')
      .doc('activities')
      .collection('fitActivity')
      .doc(activity.summary.endTimeNanos)
      .set(activity)
  })
  return new Promise((resolve, reject) => {
    const db = admin.firestore()
    const userRef = db.collection('users').doc(request.user.uid)
    return db
      .runTransaction(transaction => {
        // This code may get re-run multiple times if there are conflicts.
        return transaction.get(userRef).then(user => {
          if (!user.exists) {
            throw new Error('User not exists')
          }
          transaction.set(userRef, { latests: { lastDateOfActivitySummary: _.last(activities).summary.endTimeNanos } }, { merge: true })
        })
      })
      .then(() => {
        resolve(activities)
      })
      .catch(error => {
        reject(error)
      })
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
    rp({
      method: 'POST',
      uri: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      json: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        code: request.body.code,
        grant_type: 'authorization_code',
        redirect_uri: request.body.redirect_uri
      }
    })
      .then(data => {
        console.log(data)
        return response.status(200).json(data)
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
    rp({
      method: 'POST',
      uri: 'https://www.googleapis.com/oauth2/v4/token',
      timeout: 30 * 1000,
      json: {
        client_id: functions.config().gapi.client_id,
        client_secret: functions.config().gapi.client_secret,
        refresh_token: request.body.refresh_token,
        grant_type: 'refresh_token'
      }
    })
      .then(data => {
        console.log(data)
        return response.status(200).json(data)
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
  const dataSetId = request.body.startTimeNanos + '-' + request.body.endTimeNanos
  const requestToGoogle = {
    method: 'GET',
    uri:
      'https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes/datasets/' +
      dataSetId,
    timeout: 30 * 1000
  }
  execGApi(request.user.uid, requestToGoogle)
    .then(data => {
      summaryActivity(request.user.uid, JSON.parse(data)).then(activities => {
        saveActivitySummary(request, activities).then(() => {
          admin
            .firestore()
            .collection('users')
            .doc(request.user.uid)
            .collection('gameData')
            .doc('activities')
            .collection('fitActivity')
            .where('startTimeNanos', '<=', request.body.startTimeNanos.toString())
            .where('startTimeNanos', '>', request.body.endTimeNanos.toString())
            .orderBy('startTimeNanos', 'desc')
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
      })
    })
    .catch(err => {
      console.log(err)
      return response.status(500).json({ type: 'UnknownError', message: err })
    })
})
// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.users = functions.https.onRequest(users)
