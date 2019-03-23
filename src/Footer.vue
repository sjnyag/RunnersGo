<template>
  <footer v-if="showFooter">
    <div>
      <p>
        Icons made by
        <a href="https://www.freepik.com/" title="Freepik">Freepik</a> from
        <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by
        <a
          href="http://creativecommons.org/licenses/by/3.0/"
          title="Creative Commons BY 3.0"
          target="_blank"
        >CC 3.0 BY</a>
      </p>
      <p>
        <a
          href="https://pixabay.com/ja/users/darksouls1-2189876/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1985664"
        >Enrique Meseguer</a>による
        <a
          href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1985664"
        >Pixabay</a>からの画像
      </p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer',
  data: function() {
    return {
      showFooter: false
    }
  },
  watch: {
    $route() {
      if (this.$route.meta.hideFooter) {
        this.showHeader = false
      } else {
        this.showHeader = true
      }
    }
  }
}
</script>
