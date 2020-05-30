<template>
  <div class="address-card row justify-content-between align-items-center pr-2" ref="addressCard">
    <div class="address col-9">
      <h5>
        <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
        <em>{{address.addr2}}</em>
      </h5>
      <div>
        {{address.city}} {{address.state}} {{address.postalCode}}<br/>
        {{address.notes}}
      </div>
    </div>
    <div class="static-buttons col-3 pl-0 pr-2" v-show="!isContainerVisible">
      <ActivityButton
        class="fa-2x pr-2"
        :value="selectedResponse"
        :next="'START'"
        @button-click="updateResponse">
      </ActivityButton>
      <font-awesome-layers class="ellipsis-v-static text-muted fa-2x">
        <font-awesome-icon icon="ellipsis-v" class="ml-0">
        </font-awesome-icon>
      </font-awesome-layers>
    </div>
    <div
      class="activity-container pl-0 pr-2"
      ref="activityContainer"
      :style="{ '--x': transform, right: `${containerRight}px` }">
      <font-awesome-layers class="ellipsis-v text-muted fa-2x mr-8">
        <font-awesome-icon icon="ellipsis-v" class="ml-0">
        </font-awesome-icon>
      </font-awesome-layers>
      <ActivityButton
        class="fa-2x"
        :class="{ 'fa-3x': clickedResponse === 'NH' }"
        :value="'NH'"
        v-if="isTerritoryCheckedOut"
        @button-click="updateResponse">
      </ActivityButton>
      <ActivityButton
        class="fa-2x"
        :class="{ 'fa-3x': clickedResponse === 'HOME' }"
        :value="'HOME'"
        v-if="isTerritoryCheckedOut"
        @button-click="updateResponse">
      </ActivityButton>
      <ActivityButton
        class="fa-2x"
        :class="{ 'fa-3x': clickedResponse === 'PH' }"
        :value="'PH'"
        v-if="isTerritoryCheckedOut"
        @button-click="updateResponse">
      </ActivityButton>
      <ActivityButton
        class="fa-2x"
        :class="{ 'fa-3x': clickedResponse === 'LW' }"
        :value="'LW'"
        v-if="isTerritoryCheckedOut"
        @button-click="updateResponse">
      </ActivityButton>
      <ActivityButton
        class="fa-2x"
        :class="{ 'fa-3x': clickedResponse === 'NF' }"
        :value="'NF'"
        v-if="isTerritoryCheckedOut"
        @button-click="updateResponse">
      </ActivityButton>
      <b-link
        class="text-info"
        :to="`/addresses/${address.id}/history`"
        @click="setAddress(address)">
        <font-awesome-layers class="text-info fa-2x">
          <font-awesome-icon icon="history"></font-awesome-icon>
        </font-awesome-layers>
      </b-link>
    </div>
    <div class="col-12">
      <Address></Address>
    </div>
    <div class="hidden-boi" ref="notePanel">
      <a v-on:click="openNotePanel">[+]</a>
      <div class="note-bar">
        <ul>
          <li>note1</li>
          <li>note2</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import gsap, { Elastic } from 'gsap';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';
import Address from './Address';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;
const NUM_ALWAYS_VISIBLE_BUTTONS = 2;

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityButton,
    Address,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      isContainerVisible: false,
      transform: '',
      clickedResponse: '',
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
      fetchAddress: 'address/fetchAddress',
    }),
    resetContainerPosition() {
      const pos = -this.containerWidth;
      this.containerRight = pos;
      this.isContainerVisible = false;
    },
    async updateResponse(value) {
      if (this.selectedResponse === 'START' && value === 'START') return;

      this.clickedResponse = value;

      try {
        await this.addLog({ addressId: this.address.id, value });
        await this.fetchAddress(this.address.id);
        this.selectedResponse = this.lastActivity;
        this.clickedResponse = '';
        this.resetContainerPosition();
      } catch (e) {
        console.error('Unable to save activity log', e);
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
          this.$refs.activityContainer,
          0.4,
          { '--x': this.currentOffset },
          {
            '--x': finalOffset,
            ease: Elastic.easeOut.config(1, 0.8),
            onUpdate: () => {
              if (e.direction === DIRECTION_LEFT && Math.abs(e.velocityX) > 0.2) {
                this.containerRight = finalOffset;
                this.isContainerVisible = true;
              } else if (e.direction === DIRECTION_RIGHT) {
                this.resetContainerPosition();
              }
            },
            onComplete: () => {
              if (Math.abs(e.velocityX) > 0.2) {
                this.currentOffset = finalOffset;
              } else {
                this.currentOffset = 0;
              }
            },
          },
        );
      }
    },

    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
    },

    openNotePanel() {
      this.$refs.notePanel.style.height = '100%';
    },
  },
  mounted() {
    this.resetContainerPosition();
    this.setAddress(this.address);
    this.selectedResponse = this.lastActivity || this.START;
  },
  computed: {
    ...mapGetters({
      lastActivity: 'address/lastActivity',
      loading: 'auth/loading',
      territory: 'territory/territory',
    }),

    mapsUrl() {
      const addr1 = this.address.addr1 || '';
      const city = this.address.city || '';
      const state = this.address.state_province || '';
      return `https://www.google.com/maps/dir/?api=1&destination=${addr1} ${city} ${state}`;
    },

    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },

    overflowRatio() {
      return this.$refs.activityContainer.scrollWidth / this.$refs.activityContainer.offsetWidth;
    },

    itemWidth() {
      return this.$refs.activityContainer.scrollWidth / this.count;
    },

    count() {
      return this.$refs.activityContainer.children.length;
    },

    containerWidth() {
      const styles = window.getComputedStyle(this.$refs.activityContainer);
      const width = styles.getPropertyValue('width');
      // eslint-disable-next-line
      console.log(width);
      return this.getPxValue(width);
    },

    containerLeftButtonsWidth() {
      const buttons = Array.from(this.$refs.activityContainer.children);

      // we're only interested in buttons that are always visible, so reduce to the first n
      buttons.length = NUM_ALWAYS_VISIBLE_BUTTONS;

      let width = 0;
      buttons.forEach((b) => {
        const styles = window.getComputedStyle(b);
        const buttonWidth = styles.getPropertyValue('width');
        const paddingLeft = styles.getPropertyValue('padding-left');
        const paddingRight = styles.getPropertyValue('padding-right');

        width += this.getPxValue(buttonWidth) + this.getPxValue(paddingLeft) + this.getPxValue(paddingRight);
        // width += b.clientWidth;
      });

      // eslint-disable-next-line
      console.log('left buttons width', width);
      return width;
    },
  },
};
</script>
<style scoped>
.v-touch-address-card {
  touch-action: pan-y;
}
.hidden-boi {
  background-color: white;
  position: absolute;
  left: 0;
  bottom: 0;
  height: 10%;
  width: 100%;
  transition: ease-in-out 1s;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
}
.address {
  text-align: left;
}
.nh-text {
  font-size: 0.5em;
}
.interaction {
  cursor: pointer;
  overflow: hidden;
}
.activity-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  position: absolute;
  transform: translateX(calc(var(--x, 0) * 1%));
  background-color: #fff;
  border-width: 4px 0;
  border-color: #fff;
  border-style: solid;
  width: 100%;
}

.activity-container * {
  display: block;
}
.static-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media print {
  .interaction {
    display: none;
  }

  .address a {
    text-decoration: none;
  }
}
</style>
