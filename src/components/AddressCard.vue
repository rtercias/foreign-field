<template>
  <v-touch @pan="showRightHandControls">
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
      <div class="activity-container col-4 pl-0 pr-0" ref="activityContainer" :style="{ '--x': transform}">
        <ActivityLog v-bind="{ address, selectedResponse, territoryId }" v-on:response-update="updateResponse"></ActivityLog>
        <b-link
          :to="`/addresses/${address.id}/history`"
          @click="setAddress(address)">
          <font-awesome-layers class="text-info fa-2x">
            <font-awesome-icon icon="history">
          </font-awesome-icon>
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
    showRightHandControls(e) {
      // how far the slider has been dragged in percentage of the visible container
      const dragOffset = 100 / this.itemWidth * e.deltaX / this.count * this.overflowRatio;

      // transforming from where the slider currently
      this.transform = this.currentOffset + dragOffset;

      if (e.isFinal) {
				this.currentOffset = this.transform;
				const maxScroll = 100 - this.overflowRatio * 100;
				let finalOffset = this.currentOffset;

				// scrolled to last item
				if (this.currentOffset <= maxScroll) {
					finalOffset = maxScroll;
				} else if (this.currentOffset >= 0) {
					// scroll to first item
					finalOffset = 0;
				} else {
					// animate to next item according to pan direction
					const index = this.currentOffset / this.overflowRatio / 100 * this.count;
					const nextIndex = e.deltaX <= 0 ? Math.floor(index) : Math.ceil(index);
					finalOffset = 100 * this.overflowRatio / this.count * nextIndex;
				}

				// bounce back animation
				gsap.fromTo(
					this.$refs.activityContainer,
					0.4,
					{ '--x': this.currentOffset },
					{
						'--x': finalOffset,
						ease: Elastic.easeOut.config(1, 0.8),
						onComplete: () => {
							this.currentOffset = finalOffset;
						}
					}
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
  overflow: hidden;
  position: absolute;
  right: -50px;
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
