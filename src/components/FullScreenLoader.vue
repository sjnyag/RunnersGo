<template>
  <div class="modal">
    <loader color="#eeff41" size="160px"></loader>
  </div>
</template>
<script>
import Loader from './Loader'
export default {
  name: 'FullScreenLoader',
  components: {
    Loader
  }
}
</script>
<style lang="scss" scoped>
.modal {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: #000;
  opacity: 0.5;
  transition: opacity 1s, visibility 0s 1s;
  * {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    -webkit-transform: translateY(-50%) translateX(-50%);
  }
}
</style>
