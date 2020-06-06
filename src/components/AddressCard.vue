<template>
  <v-touch class="v-touch-address-card" @pan="slide" :pan-options="{ direction: 'horizontal'}">
    <div class="address-card row justify-content-between align-items-center pr-2" ref="addressCard">
      <div class="address col-9">
        <div>
          <h5>
            <a :href="mapsUrl" target="_blank">{{address.addr1}}</a>&nbsp;
            <em>{{address.addr2}}</em>
          </h5>
          <div>
            {{address.city}} {{address.state}} {{address.postalCode}}<br/>
            {{address.notes}}
          </div>
          <b-badge class="pml-2" variant="info" :href="lookupFastPeopleSearch" size="sm">
            <font-awesome-layers>
              <font-awesome-icon icon="phone-alt"></font-awesome-icon>
            </font-awesome-layers>
            FPS
          </b-badge>
        </div>
      </div>
      <!-- THE isContainerVisible removes col-3 so that the 'more' button
           for the notes panel moves into this spot. Remove isContainerVisible logic
           in order to fix this.-->
      <div class="static-buttons col-3 pl-0 pr-2" v-show="!isContainerVisible">
        <ActivityButton
          class="fa-2x pr-2"
          :value="selectedResponse"
          :next="'START'"
          @button-click="updateResponse">
        </ActivityButton>
        <font-awesome-layers class="ellipsis-v-static text-muted fa-2x">
          <font-awesome-icon icon="ellipsis-v"></font-awesome-icon>
        </font-awesome-layers>
      </div>
      <div
        class="activity-container pl-0 pr-2"
        ref="activityContainer"
        :style="{ '--x': transform, right: `${containerRight}px` }">
        <font-awesome-layers class="ellipsis-v text-muted fa-2x mr-8">
          <font-awesome-icon icon="ellipsis-v"></font-awesome-icon>
        </font-awesome-layers>
        <div class="buttons" v-if="isTerritoryCheckedOut">
          <ActivityButton
            v-for="(button, index) in containerButtonList"
            :key="index"
            class="fa-2x"
            :value="button.value"
            @button-click="updateResponse">
          </ActivityButton>
        </div>
        <b-link
          class="text-info"
          :to="`/addresses/${address.id}/history`"
          @click="setAddress(address)">
          <font-awesome-layers class="text-info fa-2x">
            <font-awesome-icon icon="history"></font-awesome-icon>
          </font-awesome-layers>
        </b-link>
      </div>
      <div class="row notes" ref="notePanel">
        <Address @tagFromChild="updateTags"></Address>
        <div class="m-auto">
          <b-badge v-on:click="closeNotePanel" variant="secondary"> close </b-badge>
        </div>
      </div>
      <div class="tags-list">
        <b-badge v-for="(x, i) in tags" :key="i" variant="primary">{{ x }}</b-badge>
        <!-- <b-badge variant="primary">{{ tags }}</b-badge> -->
      </div>
      <div class="more-option ml-auto pr-3">
        <b-badge v-on:click="openNotePanel" variant="primary">...</b-badge>
      </div>
    </div>
  </v-touch>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import gsap from 'gsap';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';
import Address from './Address';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;
const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW', 'NF'];

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
      animate: false,
      currentOffset: 0,
      containerRight: 0,
      isContainerVisible: false,
      transform: '',
      clickedResponse: '',
      tags: [],
    };
  },
  methods: {
    /* eslint-disable */
    updateTags(tag) {
      let index = this.tags.indexOf(tag.caption)

      if (!this.tags.includes(tag.caption)) {
        if (tag.state === true) {
          this.tags.push(tag.caption)
        } 
      }
      else if (tag.state === false) {
        this.tags.splice(index, 1)
      }
    },
    /* eslint-enable */
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
      // this.$refs.addressCard.style.paddingBottom = '5%';
    },
    closeNotePanel() {
      this.$refs.notePanel.style.height = '0';
      this.$refs.addressCard.style.paddingBottom = '0%';
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
      actionButtonList: 'address/actionButtonList',
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
      return this.getPxValue(width);
    },

    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },

    lookup411() {
      const addr1 = `${get(this.address, 'addr1', '').trim().replace(/\s+/g, '-')}`;
      const city = `${get(this.address, 'city', '').trim().replace(/\s+/g, '-')}`;
      const state = `${get(this.address, 'state_province', '').trim().replace(/\s+/g, '-')}`;
      return `https://www.411.com/address/${addr1}/${city}-${state}`;
    },

    lookupFastPeopleSearch() {
      const addr1 = `${get(this.address, 'addr1', '').trim().replace(/\s+/g, '-')}`;
      const city = `${get(this.address, 'city', '').trim().replace(/\s+/g, '-')}`;
      const state = `${get(this.address, 'state_province', '').trim().replace(/\s+/g, '-')}`;
      return `https://www.fastpeoplesearch.com/address/${addr1}_${city}-${state}`;
    },
  },
};
</script>
<style scoped>
.v-touch-address-card {
  touch-action: pan-y;
  height: 100%;
}
.notes {
  background-color: white;
  position: absolute;
  left: 0;
  bottom: 0;
  height: 0;
  transition: ease-in-out 0.3s;
}
.tags-list {
  height: 20px;
  width: 100%;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  transition: ease-in-out 0.3s  ;
}
.address {
  display: flex;
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
  height: 100%;
  min-height: 50px;
}

.activity-container * {
  display: block;
}
.activity-container .buttons {
  display: flex;
  width: 100%;
  justify-content: space-evenly;
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
