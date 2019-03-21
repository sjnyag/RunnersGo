<template>
  <div class="base mdc-layout-grid">
    <div class="mdc-layout-grid__inner">
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 title-row">
        <h1 class="title">Runners GO</h1>
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12 logo-row">
        <img :src="require('../assets/images/logo.png')">
      </div>
      <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
        <flat-button id="login" @onclick="login" name="ログイン" color="green"></flat-button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import FlatButton from './Button'
export default {
  name: 'Login',
  components: {
    FlatButton
  },
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
<style lang="scss">
$blur: 2px;
div.base {
  width: 100vw;
  height: 100vh;
  background-image: url('../assets/images/background.jpg');
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-color: #464646;
  &:before {
    content: '';
    -webkit-filter: blur($blur);
    -moz-filter: blur($blur);
    -o-filter: blur($blur);
    -ms-filter: blur($blur);
    filter: blur($blur);
    position: absolute;
    top: -$blur;
    left: -$blur;
    right: -$blur;
    bottom: -$blur;
    z-index: -1;
  }
}
</style>

<style lang="scss" scoped>
@import '@material/layout-grid/mdc-layout-grid.scss';
div.mdc-layout-grid__cell {
  justify-self: center;
  align-self: center;
  text-align: center;
}
div.title-row {
  // width: 100vw;
  // background-color: rgba(0, 0, 0, 0.5);
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
</style>
