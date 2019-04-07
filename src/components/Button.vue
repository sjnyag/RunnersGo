<template>
  <button :class="color" @click="onClick()">{{name}}</button>
</template>
<script>
export default {
  name: 'Button',
  props: { name: { default: '' }, color: { default: 'green' } },
  methods: {
    onClick() {
      this.$emit('onclick')
    }
  }
}
</script>
<style lang="scss" scoped>
$color: #5a7ab3;
$shadowColor: darken($color, 10%);
$activeColor: darken($color, 8%);
button {
  &.green {
    $color: #00e676;
    $shadowColor: darken($color, 10%);
    $activeColor: darken($color, 8%);
    background-color: $color;
    box-shadow: 0 6px $shadowColor;
    &:hover {
      box-shadow: 0 5px $shadowColor;
    }
    &:active {
      background-color: $activeColor;
    }
  }
  &.red {
    $color: #ff1744;
    $shadowColor: darken($color, 10%);
    $activeColor: darken($color, 8%);
    background-color: $color;
    box-shadow: 0 6px $shadowColor;
    &:hover {
      box-shadow: 0 5px $shadowColor;
    }
    &:active {
      background-color: $activeColor;
    }
  }
  background-color: $color;
  box-shadow: 0 3px $shadowColor;
  &:hover {
    box-shadow: 0 2px $shadowColor;
    top: 1px;
  }
  &:active {
    background-color: $activeColor;
    box-shadow: 0 0 $shadowColor;
    top: 3px;
  }
  outline: none;
  padding: 0.5em 2em;
  border: none;
  display: inline-block;
  font-size: 114%;
  line-height: 1;
  color: #fff;
  position: relative;
  border-radius: 0.5em;
  top: 0;
  transition: 0.1s box-shadow, 0.1s top, 0.2s background;
  cursor: pointer;
}
</style>
