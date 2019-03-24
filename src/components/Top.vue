<template>
  <div class="page mdc-layout-grid" v-lazy:background-image="backgroundImage">
    <full-screen-loader v-if="loading"></full-screen-loader>
    <div class="base mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 title-row">
        <h1 class="title">Runners GO</h1>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 logo-row">
        <img v-lazy="iconImage">
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button @onclick="start" name="スタート" color="green"></flat-button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import FlatButton from './Button'
import FullScreenLoader from './FullScreenLoader'
export default {
  name: 'Top',
  components: {
    FlatButton,
    FullScreenLoader
  },
  data() {
    return {
      backgroundImage: {
        src: './static/img/background.jpg'
      },
      iconImage: {
        src: './static/img/icons/android-chrome-512x512.png'
      },
      loading: false
    }
  },
  computed: {
    ...mapState({
      signedIn: state => state.auth.signedIn
    })
  },
  methods: {
    start() {
      this.loading = true
      if (this.signedIn) {
        this.$router.push('/home')
      } else {
        this.signIn()
          .then(() => {
            this.$router.push('/home')
          })
          .catch(() => {
            this.loading = false
          })
      }
    },
    ...mapActions('auth', ['signIn'])
  }
}
</script>
<style lang="scss" scoped>
@import '@material/layout-grid/mdc-layout-grid.scss';
$blur: 2px;
div.page {
  width: 100vw;
  height: 100vh;
  padding: 0;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-color: #464646;
  position: relative;
  z-index: 0;
  &:before {
    content: '';
    background-color: rgba(0, 0, 0, 0.8);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }
  div.base {
    position: absolute;
    width: 100vw;
    top: 40%;
    transform: translateY(-40%);
    -webkit-transform: translateY(-40%);
    div.mdc-layout-grid__cell {
      justify-self: center;
      align-self: center;
      text-align: center;
    }
    div.title-row {
      h1.title {
        color: white;
        font-weight: bold;
        margin: 10px;
        font-size: 300%;
        text-shadow: 5px 5px 12px rgba(41, 182, 246, 0.3);
      }
    }
    div.logo-row {
      img {
        margin: 20px;
        width: auto;
        height: 20vh;
      }
    }
    button {
      margin: 20px;
    }
  }
}
</style>
