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
    z-index: 1;
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: #fff;
    transform: translateX(calc(var(--x, 0) * 1%));
  }
</style>
