<template>
  <v-touch @pan="slide">
    <div class="address-card row justify-content-between align-items-center pl-2 pr-2">
      <div class="address col-8 pl-0 pr-0">
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
        class="activity-container col-4 pl-0"
        ref="activityContainer"
        :style="{ '--x': transform, right: `${activityContainerRight}px` }">
        <ActivityLog v-bind="{ address, selectedResponse, territoryId }" v-on:response-update="updateResponse"></ActivityLog>
        <font-awesome-layers class="text-info fa-2x" v-if="activityContainerRight===activityContainerStart">
          <font-awesome-icon icon="ellipsis-v">
          </font-awesome-icon>
        </font-awesome-layers>
        <b-link
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
import ActivityLog from './ActivityLog';

const RIGHT_PANEL_OFFSET = -48;
const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityLog,
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
    };
  },
  methods: {
    ...mapActions({
      setAddress: 'address/setAddress',
    }),
    updateResponse(value) {
      this.selectedResponse = value;
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
