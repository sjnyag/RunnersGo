<template>
  <div class="page mdc-layout-grid">
    <div class="base mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
        <img v-lazy="profile.picture" v-if="profile" class="profile-icon round">
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">{{profile.name}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">クラス：{{profile.class}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
        <flat-button @onclick="start" name="プロフィール変更" color="gray"></flat-button>
      </div>
    </div>
    <flat-button @onclick="start" name="クラスを変更する" color="gray"></flat-button>
    <div class="base mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">所持金：{{profile.money}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">オーブ：{{profile.orb}}</div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="monsters" name="モンスターリスト" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="最近のラン" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="フレンドリスト" color="gray"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <p v-if="alreadySummonedToday">本日のガチャは終了しています</p>
        <flat-button @onclick="summon" name="デイリーガチャ" color="green"></flat-button>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="logout" name="ログアウト" color="red"></flat-button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import FlatButton from './Button'
export default {
  name: 'Home',
  components: {
    FlatButton
  },
  data() {
    return {
      alreadySummonedToday: false
    }
  },
  mounted: function() {
    this.isEnableDailySummon().then(result => {
      this.alreadySummonedToday = !result
    })
  },
  computed: {
    ...mapState({
      profile: state => state.gameData.profile
    })
  },
  methods: {
    start: function() {
      this.$router.push('/history')
    },
    monsters: function() {
      this.$router.push('/monsters')
    },
    logout: function() {
      this.signOut().then(() => {
        this.$router.push('/')
      })
    },
    summon: function() {
      this.$router.push('/summon')
    },
    ...mapActions('auth', ['signOut']),
    ...mapActions('gameData', ['isEnableDailySummon'])
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
