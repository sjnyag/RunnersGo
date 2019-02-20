<template>
  <div class="hello">
    <img :src="image">
    <template v-for="(session, index) in sessions">
      <session :key="'session_'+index" :session="session"></session>
    </template>
  </div>
</template>
<script>
import Session from './Session'
import moment from 'moment'

import firebase from 'firebase/app'
require('firebase/firestore')
export default {
  name: 'Home',
  components: {
    Session
  },
  data() {
    return {
      sessions: [],
      signedIn: true,
      image: 'https://picsum.photos/96/96'
    }
  },
  mounted() {
    const profile = window.gapi.auth2
      .getAuthInstance()
      .currentUser.get()
      .getBasicProfile()
    const id = profile.getId()
    const image = profile.getImageUrl()
    window.firebase = firebase
    window.db = firebase.firestore()
    window.db
      .collection('users')
      .doc(id)
      .set(
        {
          image: image
        },
        { merge: true }
      )
      .catch(error => {
        console.error('Error adding document: ', error)
      })

    window.db
      .collection('users')
      .doc(id)
      .get()
      .then(doc => {
        if (doc.exists) {
          this.image = doc.data().image
        } else {
          console.log('No such document!')
        }
      })
      .catch(function(error) {
        console.log('Error getting document:', error)
      })
    // this.execApi()
  },
  methods: {
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
