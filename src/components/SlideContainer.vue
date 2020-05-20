<template>
  <v-touch class="slide-container" @pan="slide" :pan-options="{ direction: 'horizontal'}">
    <SlidePanel left ref="leftPanel" :transform="leftTransform" :position="leftPosition">
      <slot name="left-panel"></slot>
    </SlidePanel>
    <div ref="main">
      <slot></slot>
    </div>
    <SlidePanel right ref="rightPanel" :transform="rightTransform" :position="rightPosition">
      <slot name="right-panel"></slot>
    </SlidePanel>
  </v-touch>
</template>
<script>
import gsap from 'gsap';
import SlidePanel from './SlidePanel';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;

export default {
  name: 'SlideContainer',
  components: {
    SlidePanel,
  },
  data() {
    return {
      leftTransform: 0,
      rightTransform: 0,
      leftPosition: 0,
      rightPosition: 0,
      leftOffset: 0,
      rightOffset: 0,
    };
  },
  mounted() {
    this.resetPosition();
  },
  methods: {
    slide(e) {
      let transform = 0;
      this.setActivePanel();

      if (e.direction === DIRECTION_LEFT) {
        if (this.activePanel === '' || this.activePanel === 'leftPanel') {
          transform = this.leftTransform;
        } else {
          return;
        }
      } else if (e.direction === DIRECTION_RIGHT) {
        if (this.activePanel === '' || this.activePanel === 'rightPanel') {
          transform = this.rightTransform;
        } else {
          return;
        }
      }

      if (Number.isNaN(transform)) transform = 0;
      const dragOffset = 100 / this.mainWidth * e.deltaX / this.count * this.overflowRatio;

      if (Math.abs(e.velocityX) > 0.2) {
        transform += dragOffset;
      }

      if (e.isFinal) {
        let currentOffset = 0;
        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === 'leftPanel') {
            this.leftOffset = transform;
            currentOffset = this.leftOffset;
          } else if (this.activePanel === '') {
            this.rightOffset = transform;
            currentOffset = this.rightOffset;
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === 'rightPanel') {
            this.rightOffset = transform;
            currentOffset = this.rightOffset;
          } else if (this.activePanel === '') {
            this.leftOffset = transform;
            currentOffset = this.leftOffset;
          }
        }

        const maxScroll = 100 - this.overflowRatio * 100;
        let finalOffset = currentOffset;

        if (currentOffset <= maxScroll) {
          finalOffset = maxScroll;
        } else if (currentOffset >= 0) {
          finalOffset = 0;
        } else {
          const index = currentOffset / this.overflowRatio / 100 * this.count;
          const nextIndex = e.deltaX <= 0 ? Math.floor(index) : Math.ceil(index);
          finalOffset = 100 * this.overflowRatio / this.count * nextIndex;
        }

        let panel = '';

        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === '' || this.activePanel === 'leftPanel') {
            this.leftTransform = transform;
            panel = 'rightPanel';
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === '' || this.activePanel === 'rightPanel') {
            this.rightTransform = transform;
            panel = 'leftPanel';
          }
        }

        gsap.fromTo(
          this.$refs[panel],
          0.4,
          { '--x': currentOffset },
          {
            '--x': finalOffset,
            onUpdate: () => this.onSlideUpdate(e, finalOffset),
            onComplete: () => this.onSlideComplete(e, finalOffset),
          },
        );
      }
    },
    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },
    onSlideUpdate(e, finalOffset) {
      if (Math.abs(e.velocityX) > 0.2) {
        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === '') {
            this.rightTransform = finalOffset;
          } else if (this.activePanel === 'leftPanel') {
            this.leftTransform = finalOffset;
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === '') {
            this.leftTransform = finalOffset;
          } else if (this.activePanel === 'rightPanel') {
            this.rightTransform = finalOffset;
          }
        }
      }
    },

    onSlideComplete(e, finalOffset) {
      if (Math.abs(e.velocityX) > 0.2) {
        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === '') {
            this.rightTransform = finalOffset;
            this.rightPosition = finalOffset;
            this.activePanel = 'rightPanel';
          } else if (this.activePanel === 'leftPanel') {
            this.resetPosition();
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === '') {
            this.leftTransform = finalOffset;
            this.leftPosition = finalOffset;
            this.activePanel = 'leftPanel';
          } else if (this.activePanel === 'rightPanel') {
            this.resetPosition();
          }
        }
      }
    },
    resetPosition() {
      this.leftPosition = -this.mainWidth;
      this.rightPosition = this.mainWidth;
      this.leftTransform = 0;
      this.rightTransform = 0;
      this.activePanel = '';
    },
    setActivePanel() {
      const mainWidth = this.containerWidth;
      const leftPanelPosition = this.$refs.leftPanel.$el.getBoundingClientRect().left;
      const rightPanelPosition = this.$refs.rightPanel.$el.getBoundingClientRect().left;
      const rightPanel = rightPanelPosition <= mainWidth ? 'rightPanel' : '';
      this.activePanel = leftPanelPosition >= 0 ? 'leftPanel' : rightPanel;
    },
  },
  computed: {
    overflowRatio() {
      return 1;
    },
    mainWidth() {
      return this.$refs.main.scrollWidth / this.count;
    },
    count() {
      return this.$refs.main.children.length;
    },
    containerWidth() {
      const styles = window.getComputedStyle(this.$refs.main);
      const width = styles.getPropertyValue('width');
      return this.getPxValue(width);
    },
  },
};
</script>
<style>
  .slide-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .slide-container > * {
    width: 100%;
  }
</style>
