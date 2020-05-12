<template>
  <v-touch @pan="slide">
    <div class="address-card row justify-content-between align-items-center pl-2 pr-2">
      <div class="address col-12">
        <h5>
          <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
          <em>{{address.addr2}}</em>
        </h5>
        <div>
          {{address.city}} {{address.state}} {{address.postalCode}}<br/>
          {{address.notes}}
        </div>
      </div>
      <div
        class="activity-container pl-0 pr-4"
        ref="activityContainer"
        :style="{ '--x': transform, right: `${activityContainerRight}px` }">
        <ActivityButton
          :class="'fa-3x'"
          :value="selectedResponse"
          v-if="activityContainerRight===activityContainerStart"
          :next="'START'"
          @button-click="updateResponse">
        </ActivityButton>
        <font-awesome-layers class="text-muted fa-2x pr-3">
          <font-awesome-icon icon="ellipsis-v">
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
    </div>
  </v-touch>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import gsap, { Elastic } from 'gsap';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';

const RIGHT_PANEL_OFFSET = -330;
const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityButton,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      animate: false,
      currentOffset: 0,
      activityContainerStart: RIGHT_PANEL_OFFSET,
      activityContainerRight: RIGHT_PANEL_OFFSET,
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
    async updateResponse(value) {
      this.clickedResponse = value;

      try {
        await this.addLog({ addressId: this.address.id, value });
        await this.fetchAddress(this.address.id);
        this.selectedResponse = this.lastActivity;
        this.activityContainerRight = RIGHT_PANEL_OFFSET;
        this.clickedResponse = '';
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    slide(e) {
      const dragOffset = 100 / this.itemWidth * e.deltaX / this.count * this.overflowRatio;
      this.transform = this.currentOffset + dragOffset;

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
              if (e.direction === DIRECTION_LEFT) {
                this.activityContainerRight = finalOffset;
              } else if (e.direction === DIRECTION_RIGHT) {
                this.activityContainerRight = RIGHT_PANEL_OFFSET;
              }
            },
            onComplete: () => {
              this.currentOffset = finalOffset;
            },
          },
        );
      }
    },
  },
  mounted() {
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
  },
};
</script>
<style scoped>
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
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
