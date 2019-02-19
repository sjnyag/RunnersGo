<template>
  <div id="firebaseui-auth-container"></div>
</template>
<script>
import { mapActions } from 'vuex'
import firebase from 'firebase/app'
import firebaseui from 'firebaseui'
export default {
  name: 'Login',
  data() {
    return {
      uiConfig: {
        signInOptions: [
          {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            scopes: ''
          }
        ],
        callbacks: {
          signInSuccessWithAuthResult: user => {
            return false
          }
        }
      }
    }
  },
  mounted() {
    var ui = new firebaseui.auth.AuthUI(firebase.auth())
    ui.start('#firebaseui-auth-container', this.uiConfig)
  },
  methods: {
    ...mapActions('auth', ['isSignedIn'])
  }
}
</script>
