<template>
  <header class="mdc-top-app-bar mdc-top-app-bar--fixed">
    <div class="mdc-top-app-bar__row mdc-top-app-bar--fixed">
      <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
        <a href="#" class="material-icons mdc-top-app-bar__navigation-icon">menu</a>
        <span class="mdc-top-app-bar__title">{{title}}</span>
      </section>
    </div>
  </header>
</template>

<script>
// import { MDCTopAppBar } from '@material/top-app-bar/index'
export default {
  name: 'Header',
  data: function() {
    return {
      title: ''
    }
  },
  mounted: function() {
    this.title = this.$route.meta.title
    // Instantiation
    // const topAppBarElement = document.querySelector('.mdc-top-app-bar')
    // const topAppBar = new MDCTopAppBar(topAppBarElement)
  },
  watch: {
    $route() {
      this.title = this.$route.meta.title
    }
  }
}
</script>
<style lang="scss">
@import '@material/top-app-bar/mdc-top-app-bar.scss';

.mdc-top-app-bar {
  @include mdc-top-app-bar-fill-color-accessible(#112244);
  @include mdc-top-app-bar-icon-ink-color(on-primary);
}
</style>
