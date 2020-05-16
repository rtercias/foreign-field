<template>
  <div class="sliding-panel"
    :ref="name"
    :style="{ '--x': transform, right: `${positionRight}px` }">
    <slot></slot>
  </div>
</template>
<script>
import gsap from 'gsap';
import kebabCase from 'lodash/kebabCase';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;

export default {
  name: 'SlidePanel',
  props: [
    'name',
    'direction',
  ],
  data() {
    return {
      animate: false,
      currentOffset: 0,
      positionRight: 0,
      transform: '',
    };
  },
  mounted() {
    this.close();
  },
  computed: {
    openingDirection() {
      return this.direction === 'left' ? DIRECTION_LEFT : DIRECTION_RIGHT;
    },

    closingDirection() {
      return this.direction === 'left' ? DIRECTION_RIGHT : DIRECTION_LEFT;
    },

    overflowRatio() {
      return this.$refs[this.name].scrollWidth / this.$refs[this.name].offsetWidth;
    },

    itemWidth() {
      const { scrollWidth } = this.$refs[this.name];
      return this.count > 0 ? scrollWidth / this.count : scrollWidth;
    },

    count() {
      return this.$refs[this.name].children.length;
    },

    containerWidth() {
      const styles = window.getComputedStyle(this.$refs[this.name]);
      const width = styles.getPropertyValue('width');
      return this.getPxValue(width);
    },
  },
  methods: {
    open() {
      this.$emit(`${kebabCase(this.name)}-open`);
    },
    close() {
      const pos = -this.containerWidth;
      this.positionRight = pos;
      this.$emit(`${kebabCase(this.name)}-close`);
    },

    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },

    onSlideUpdate(e, finalOffset) {
      if (e.direction === this.openingDirection && Math.abs(e.velocityX) > 0.2) {
        this.positionRight = finalOffset;
      } else if (e.direction === this.closingDirection) {
        this.close();
      }
    },

    onSlideComplete(e, finalOffset) {
      if (Math.abs(e.velocityX) > 0.2) {
        this.currentOffset = finalOffset;
      } else {
        this.currentOffset = 0;
      }
    },

    slide(e) {
      if (Number.isNaN(this.transform)) this.transform = 0;
      const dragOffset = 100 / this.itemWidth * e.deltaX / this.count * this.overflowRatio;
      if (Math.abs(e.velocityX) > 0.2) {
        this.transform = this.currentOffset + dragOffset;
      }

      if (e.isFinal) {
        this.currentOffset = this.transform;
        const maxScroll = 100 - this.overflowRatio * 100;
        let finalOffset = this.currentOffset;

        if (this.currentOffset <= maxScroll) {
          finalOffset = maxScroll;
        } else if (this.currentOffset >= 0) {
          finalOffset = 0;
        } else {
          const index = this.currentOffset / this.overflowRatio / 100 * this.count;
          const nextIndex = e.deltaX <= 0 ? Math.floor(index) : Math.ceil(index);
          finalOffset = 100 * this.overflowRatio / this.count * nextIndex;
        }

        gsap.fromTo(
          this.$refs[this.name],
          0.4,
          { '--x': this.currentOffset },
          {
            '--x': finalOffset,
            onUpdate: () => this.onSlideUpdate(e, finalOffset),
            onComplete: () => this.onSlideComplete(e, finalOffset),
          },
        );
      }
    },
  },
};
</script>
<style>

</style>
