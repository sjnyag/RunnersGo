<template>
  <div>
    <div class="mdc-card">
      <div class="mdc-card__primary-action" tabindex="0">
        <span class="mdc-typography mdc-typography--headline6">{{date}}</span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DateLabel',
  props: {
    date: String
  }
}
</script>
<style lang="scss" scoped>
@import '@material/card/mdc-card';
.mdc-card {
  margin: 16px;
  padding: 4px;
}
.icon-text {
  display: inline-flex;
}
</style>
