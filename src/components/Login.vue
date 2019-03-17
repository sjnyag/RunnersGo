<template>
  <div>
    <div>{{profile}}</div>
    <button id="login" @click="login">Login</button>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
export default {
  name: 'Login',
  mounted() {
    this.isSignedIn().then(isSignedIn => {
      if (isSignedIn) {
        this.$router.push('/home')
      }
    })
  },
  computed: {
    ...mapState({
      profile: state => state.auth.profile
    })
  },
  methods: {
    login() {
      this.signIn().then(() => {
        this.$router.push('/home')
      })
    },
    ...mapActions('auth', ['signIn', 'isSignedIn'])
  }
}
</script>
