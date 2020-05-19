<template>
  <div
    class="slide-panel"
    :class="{
      left,
      right,
    }"
    scope="panel"
    :style="{
      '--x': transform,
      left: `${position}px`,
    }">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'SlidePanel',
  props: {
    main: Boolean,
    left: Boolean,
    right: Boolean,
    position: Number,
    transform: Number,
  },
  data() {
    return {};
  },
};
</script>

<style>
  .slide-panel {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: #fff;
  }
  .slide-panel.left {
    left: -100%;
  }
  .slide-panel.right {
    left: 100%;
  }
</style>
