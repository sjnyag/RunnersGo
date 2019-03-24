<template>
  <div>
    <img :src="profile.picture" v-if="profile">
  </div>
</template>
<script>
import firebase from 'firebase/app'
import { mapState } from 'vuex'
import 'firebase/messaging'
import 'firebase/firestore'

export default {
  name: 'Home',
  computed: {
    ...mapState({
      profile: state => state.auth.profile
    })
  },
  mounted() {
    this.initFCM()
    this.registeFCM()
  },
  methods: {
    initFCM() {
      this.$messaging.onTokenRefresh(() => {
        this.getToken()
      })
      this.$messaging.onMessage(payload => {
        console.log('Message receiver ', payload)
        console.log('Notification: ', payload.notification)
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
          } else {
            console.log('No such document!')
          }
        })
        .catch(function(error) {
          console.log('Error getting document:', error)
        })
    }
  }
}
</script>
