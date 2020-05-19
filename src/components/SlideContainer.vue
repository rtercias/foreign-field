<template>
  <v-touch class="slide-container" @pan="slide" :pan-options="{ direction: 'horizontal'}">
    <SlidePanel left ref="leftPanel" :transform="leftTransform" :position="leftPosition">Left Panel</SlidePanel>
    <div ref="main"
      ><slot></slot>
    </div>
    <SlidePanel right ref="rightPanel" :transform="rightTransform" :position="rightPosition">Right Panel</SlidePanel>
  </v-touch>
</template>
<script>
/* eslint-disable */ 
import gsap, { Elastic } from 'gsap';
import SlidePanel from './SlidePanel';
import capitalize from 'lodash/capitalize';

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
        if (this.activePanel === ''  || this.activePanel === 'rightPanel') {
          transform = this.rightTransform;
        } else {
          return;
        }
      }

      if (Number.isNaN(transform)) transform = 0;
      const dragOffset = 100 / this.mainWidth * e.deltaX / this.count * this.overflowRatio;
      if (Math.abs(e.velocityX) > 0.2) {
        transform = transform + dragOffset;
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
          // TODO: may need to look into deltaX for leftPanel
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
          if (this.activePanel === ''  || this.activePanel === 'rightPanel') {
            this.rightTransform = transform;
            panel = 'leftPanel';
          }
        }

        console.log('panel', panel);
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
    pick(direction, callback) {
      let prefix = '';
      if (direction === DIRECTION_LEFT) {
        if (this.activePanel === '' || this.activePanel === 'leftPanel') {
          // this[`left${capitalize(key)}`] = value;
          prefix = 'left';
        }
      } else if (direction === DIRECTION_RIGHT) {
        if (this.activePanel === ''  || this.activePanel === 'rightPanel') {
          // this[`right${capitalize(key)}`] = transform;
          prefix = 'right';
        }
      }
      if (prefix !== '' && typeof callback === 'function') callback(prefix);
    },
    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },
    onSlideUpdate(e, finalOffset) {
      if (Math.abs(e.velocityX) > 0.2) {
        this.setActivePanel();
        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === '') {
            this.rightPosition = finalOffset;
          } else if (this.activePanel === 'leftPanel') {
            this.leftPosition === finalOffset;
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === '') {
            this.leftPosition = finalOffset;
          } else if (this.activePanel ==='rightPanel') {
            this.rightPosition === finalOffset;
          }
        }
      }
    },

    onSlideComplete(e, finalOffset) {
      if (Math.abs(e.velocityX) > 0.2) {
        this.setActivePanel();
        if (e.direction === DIRECTION_LEFT) {
          if (this.activePanel === '') {
            this.rightPosition = finalOffset;
            this.activePanel = 'rightPanel';
          } else if (this.activePanel === 'leftPanel') {
            this.resetPosition();
          }
        } else if (e.direction === DIRECTION_RIGHT) {
          if (this.activePanel === '') {
            this.leftPosition = finalOffset;
            this.activePanel = 'leftPanel'
          } else if (this.activePanel ==='rightPanel') {
            this.rightPosition === finalOffset;
            this.resetPosition();
          }
        }
      }
    },
    resetPosition() {
      this.leftPosition = -this.mainWidth;
      this.rightPosition = this.mainWidth;
      this.activePanel = '';
    },
    setActivePanel() {
      const mainWidth = this.$refs.main.getBoundingClientRect().width;
      const leftPanelPosition = this.$refs.leftPanel.$el.getBoundingClientRect().left;
      const rightPanelPosition = this.$refs.rightPanel.$el.getBoundingClientRect().left;
      this.activePanel = leftPanelPosition >= 0 ? 'leftPanel' : rightPanelPosition <= mainWidth ? 'rightPanel' : '';
    },
  },
  computed: {
    overflowRatio() {
      return this.$refs.main.scrollWidth / this.$refs.main.offsetWidth;
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
  }
  .slide-container > * {
    width: 100%;
  }
</style>
