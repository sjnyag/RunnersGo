<template>
  <div class="page mdc-layout-grid">
    <div class="base mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-8">
        <img v-lazy="profile.picture" v-if="profile">
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">{{profile.name}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
        クラス：{{profile.class}}
        <flat-button @onclick="start" name="クラスを変更する" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">所持金：{{profile.money}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">オーブ：{{profile.orb}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="カードリスト" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="最近のラン" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="フレンドリスト" color="green"></flat-button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import FlatButton from './Button'
export default {
  name: 'Home',
  components: {
    FlatButton
  },
  computed: {
    ...mapState({
      profile: state => state.auth.profile
    })
  },
  methods: {
    start: function() {
      this.$router.push('/history')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@material/layout-grid/mdc-layout-grid.scss';
</style>
