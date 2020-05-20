<template>
  <SlideContainer>
    <template v-slot:left-panel>
      <div class="address-buttons">
        <b-button class="mr-3 pr-3 pl-3" variant="info" :href="lookup411" size="sm">
          <font-awesome-layers>
            <font-awesome-icon icon="phone-alt"></font-awesome-icon>
          </font-awesome-layers>
          <div>411</div>
        </b-button>
        <b-button class="mr-3 pr-3 pl-3" variant="warning" :href="lookupFastPeopleSearch" size="sm">
          <font-awesome-layers>
            <font-awesome-icon icon="phone-alt"></font-awesome-icon>
          </font-awesome-layers>
          <div>FPS</div>
        </b-button>
      </div>
    </template>
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
          <font-awesome-icon icon="ellipsis-v"></font-awesome-icon>
        </font-awesome-layers>
      </div>
    </div>
    <template v-slot:right-panel>
      <div class="activity-container">
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
    </template>
  </SlideContainer>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';
import SlideContainer from './SlideContainer';
import SlidePanel from './SlidePanel';

const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    ActivityButton,
    SlideContainer,
    SlidePanel,
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

    getPxValue(styleValue) {
      return Number(styleValue.substring(0, styleValue.indexOf('px')));
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
      return this.itemWidth;
    },

    itemWidth() {
      return this.$refs.activityContainer.scrollWidth;
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
.address-buttons {
  display: flex;
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
