<template>
  <div>
    <img :src="profile.picture" v-if="profile">
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'Home',
  computed: {
    ...mapState({
      profile: state => state.auth.profile
    })
  }
}
</script>
