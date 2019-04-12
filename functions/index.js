const functions = require('firebase-functions')
const cors = require('cors')({ origin: true })
const rp = require('request-promise')
const admin = require('firebase-admin')
const _ = require('lodash')

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

class AlreadySummonedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AlreadySummonedError'
  }
}

const express = require('express')
const cookieParser = require('cookie-parser')()
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
const MONSTERS = {
  1: { no: 1, rarity: 2, url: 'Amazons.png', name: 'アマゾネス' },
  2: { no: 2, rarity: 1, url: 'Dwarf.png', name: 'ドワーフ' },
  3: { no: 3, rarity: 2, url: 'Ettin.png', name: 'エティン' },
  4: { no: 4, rarity: 1, url: 'Ghast.png', name: 'ガスト' },
  5: { no: 5, rarity: 2, url: 'Kelpie.png', name: 'ケルピー' },
  6: { no: 6, rarity: 1, url: 'Kobold.png', name: 'コボルド' },
  7: { no: 7, rarity: 1, url: 'Yeti.png', name: 'イエティ' }
}
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
const updateGoogleApiTokenIfNeed = (auth, uid) => {
  const needsUpdate = auth => {
    return auth.expires_at && auth.code && auth.expires_at < new Date().getTime()
  }
  if (!needsUpdate(auth)) {
    console.log('use existing token')
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
const execGApi = (request, requestToGoogle) => {
  return new Promise(resolve => {
    resolveGApiHeader(request.user.uid).then(header => {
      rp(Object.assign(header, requestToGoogle)).then(data => {
        resolve(data)
      })
    })
  })
}
const summaryActivity = response => {
  const isContinuous = (before, after) => {
    return (after - before) / (1000 * 1000 * 1000) < 15 * 60
  }
  const isWorkout = summary => {
    return (summary.endTimeNanos - summary.startTimeNanos) / (1000 * 1000 * 1000) > 5 * 60
  }
  let before = 0
  const result = []
  response.point.forEach(point => {
    if (isContinuous(before, point.startTimeNanos)) {
      _.last(result).summary.endTimeNanos = point.endTimeNanos
    } else {
      point.summary = {
        startTimeNanos: point.startTimeNanos,
        endTimeNanos: point.endTimeNanos
      }
      result.push(point)
    }
    before = point.endTimeNanos
  })
  return _.reverse(_.filter(result, point => isWorkout(point.summary)))
}
users.post('/activities', (request, response) => {
  const requestToGoogle = {
    method: 'GET',
    uri:
      'https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes/datasets/' +
      request.body.datasetId,
    timeout: 30 * 1000
  }
  execGApi(request, requestToGoogle)
    .then(data => {
      return response.status(200).json(summaryActivity(JSON.parse(data)))
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
