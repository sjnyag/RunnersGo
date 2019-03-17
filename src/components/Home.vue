<template>
  <div>
    <template v-if="token"></template>
    <img :src="profile.picture" v-if="profile">
    <p>{{notification}}</p>
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
  </div>
</template>
<script>
import Session from './Session'
import moment from 'moment'
import firebase from 'firebase/app'
import { mapState } from 'vuex'
import 'firebase/messaging'
import 'firebase/firestore'

export default {
  name: 'Home',
  components: {
    Session
  },
  data() {
    return {
      sessions: [],
      signedIn: true,
      image: 'https://picsum.photos/96/96',
      token: '',
      remoteProfile: null,
      notification: null
    }
  },
  computed: {
    ...mapState({
      profile: state => state.auth.profile
    })
  },
  mounted() {
    this.initFCM()
    this.registeFCM()
    this.execApi()
  },
  methods: {
    initFCM() {
      this.$messaging.onTokenRefresh(() => {
        this.getToken()
      })
      this.$messaging.onMessage(payload => {
        console.log('Message receiver ', payload)
        this.notification = payload.notification
        console.log('Notification: ', this.notification)
      })
    },
    registeFCM() {
      this.$messaging
        .requestPermission()
        .then(() => {
          console.log('Notification permission granted.')
          this.getToken()
        })
        .catch(err => {
          console.log('Unable to get permission to notify.', err)
        })
    },
    getToken() {
      this.$messaging
        .getToken()
        .then(currentToken => {
          if (currentToken) {
            this.setTokenSentToServer(false)
            this.sendTokenToServer(currentToken)
          } else {
            console.log('No Instance ID token available. Request permission to generate one.')
            this.setTokenSentToServer(false)
          }
        })
        .catch(err => {
          console.log('An error occurred while retrieving token. ', err)
          this.setTokenSentToServer(false)
        })
    },
    sendTokenToServer(token) {
      this.updateUserProfile({ token: token })
    },
    setTokenSentToServer(type) {
      // if (type) return
      // TODO: Delete Register Token From Your Server
    },
    updateUserProfile(data) {
      const id = this.profile.id
      firebase
        .firestore()
        .collection('users')
        .doc(id)
        .set(data, { merge: true })
        .catch(error => {
          console.error('Error adding document: ', error)
        })
    },
    readUserProfile() {
      const id = this.profile.id
      firebase
        .firestore()
        .collection('users')
        .doc(id)
        .get()
        .then(doc => {
          if (doc.exists) {
            this.remoteProfile = doc.data()
          } else {
            console.log('No such document!')
          }
        })
        .catch(function(error) {
          console.log('Error getting document:', error)
        })
    },
    execApi() {
      window.gapi.client.fitness.users.dataSources.datasets
        .get({
          userId: 'me',
          dataSourceId: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
          datasetId: this.lastWeek().unix() * 1000 * 1000 * 1000 + '-' + moment().unix() * 1000 * 1000 * 1000
        })
        .then(
          response => {
            const isContinuous = function(before, after) {
              return (after - before) / (1000 * 1000 * 1000) < 15 * 60
            }
            const isWorkout = function(summary) {
              return (summary.endTimeNanos - summary.startTimeNanos) / (1000 * 1000 * 1000) > 5 * 60
            }
            let before = 0
            const result = []
            response.result.point.forEach(point => {
              if (isContinuous(before, point.startTimeNanos)) {
                this._.last(result).summary.endTimeNanos = point.endTimeNanos
              } else {
                point.summary = {
                  startTimeNanos: point.startTimeNanos,
                  endTimeNanos: point.endTimeNanos
                }
                result.push(point)
              }
              before = point.endTimeNanos
            })
            this.sessions = this._.reverse(this._.filter(result, point => isWorkout(point.summary)))
          },
          reason => {
            console.log('Error: ' + reason.result.error.message)
          }
        )
    },
    lastWeek: function() {
      return moment(new Date()).subtract(7, 'days')
    }
  }
}
</script>
