<template>
  <v-touch class="v-touch-address-card" @pan="slide" :pan-options="{ direction: 'horizontal'}">
    <div class="address-card row justify-content-between align-items-center pr-2" ref="addressCard">
      <div class="address col-9">
        <div>
          <h5 class="mb-0">
            <b-link :to="`/territories/${group}/${territoryId}/addresses/${address.id}/detail`">
              {{address.addr1}}
            </b-link>&nbsp;
          </h5>
          {{address.addr2}}
          <div class="mb-2">
            {{address.city}} {{address.state_province}} {{address.postal_code}}
          </div>
          <div class="phone">
            <a :href="`tel:${address.phone}`">{{ formattedPhone }}</a>
          </div>
        </div>
      </div>
      <div class="static-buttons col-3 pl-0 pr-2" v-show="!isContainerVisible">
        <ActivityButton
          class="fa-2x pr-2"
          :value="selectedResponse"
          :next="'START'"
          @button-click="confirmClearStatus">
        </ActivityButton>
        <font-awesome-layers class="ellipsis-v-static text-muted fa-2x" @click="openActivityContainer">
          <font-awesome-icon icon="ellipsis-v"></font-awesome-icon>
        </font-awesome-layers>
      </div>
      <div
        class="activity-container pl-0 pr-2"
        ref="activityContainer"
        :style="{
          '--x': transform,
          right: `${containerRight}px`,
          transition: `${clickedToOpen ? 'right 0.2s linear' : 'none'}`
        }">
        <font-awesome-layers class="ellipsis-v text-muted fa-2x mr-8" @click="openActivityContainer">
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
          :to="`/territories/${group}/${territoryId}/addresses/${address.id}/history`"
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
import gsap from 'gsap';
import get from 'lodash/get';
import AddressLinks from './AddressLinks';
import ActivityButton from './ActivityButton';

const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 4;
const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId', 'group'],
  components: {
    AddressLinks,
    ActivityButton,
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
      clickedToOpen: false,
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
    async confirmClearStatus() {
      try {
        const value = await this.$bvModal.msgBoxConfirm('Clear the address status?', {
          title: `${this.address.addr1} ${this.address.addr2}`,
          centered: true,
        });

        if (value) {
          this.updateResponse();
        }
      } catch (err) {
        // do nothing
      }
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
      this.clickedToOpen = false;
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
          0,
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

    openActivityContainer() {
      this.clickedToOpen = true;
      if (this.isContainerVisible) {
        this.resetContainerPosition();
      } else {
        this.containerRight = 0;
        this.isContainerVisible = true;
      }
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

    formattedPhone() {
      return this.address && this.address.phone && this.address.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
  },
};
</script>
<style scoped>
.v-touch-address-card {
  touch-action: pan-y;
}
.address-card {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
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
