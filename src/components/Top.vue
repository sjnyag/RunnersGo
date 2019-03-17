<template>
  <div></div>
</template>
<script>
import { mapActions } from 'vuex'
export default {
  name: 'Top',
  mounted() {
    this.isSignedIn().then(isSignedIn => {
      if (isSignedIn) {
        this.$router.push('/home')
      } else {
        this.$router.push('/login')
      }
    })
  },
  methods: {
    ...mapActions('auth', ['isSignedIn'])
  }
}
</script>
