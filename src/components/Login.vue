<template>
  <div>
    <button id="login" @click="login">Login</button>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
export default {
  name: 'Login',
  methods: {
    login() {
      this.signIn().then(() => {
        this.$router.push('/home')
      })
    },
    ...mapActions('auth', ['signIn'])
  }
}
</script>
