<template>
  <div class="page mdc-layout-grid">
    <div class="base mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
        <img v-lazy="profile.picture" v-if="profile" class="profile-icon round">
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">{{profile.name}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">クラス：{{profile.class}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
    <flat-button @onclick="start" name="プロフィール変更" color="green"></flat-button></div>
    </div>
    <flat-button @onclick="start" name="クラスを変更する" color="green"></flat-button>
    <div class="base mdc-layout-grid__inner">
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
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="summon" name="デイリーガチャ" color="green"></flat-button>
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
      profile: state => state.gamedata.profile
    })
  },
  methods: {
    start: function() {
      this.$router.push('/history')
    },
    summon: function() {
      this.$router.push('/summon')
    }
  }
}
</script>

<style lang="scss" scoped>
.round {
  border-radius: 50%;
}
.profile-icon {
  width: 200px;
}
@import '@material/layout-grid/mdc-layout-grid.scss';
</style>
