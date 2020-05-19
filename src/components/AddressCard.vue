<template>
  <SlideContainer>
    <div>Middle Panel</div>
  </SlideContainer>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import ActivityButton from './ActivityButton';
import SlideContainer from './SlideContainer';
import SlidePanel from './SlidePanel';

// const DIRECTION_LEFT = 2;
// const DIRECTION_RIGHT = 4;
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
    // this.resetContainerPosition();
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

    phoneLookup() {
      const addr1 = `${get(this.address, 'addr1', '').trim().replace(/\s+/g, '-')}`;
      const city = `${get(this.address, 'city', '').trim().replace(/\s+/g, '-')}`;
      const state = `${get(this.address, 'state_province', '').trim().replace(/\s+/g, '-')}`;
      return `https://www.411.com/address/${addr1}/${city}-${state}`;
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
