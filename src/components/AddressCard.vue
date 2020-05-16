<template>
  <v-touch
    class="v-touch-address-card"
    @panleft="slideLeft"
    @panright="slideRight"
    :pan-options="{ direction: 'horizontal'}">
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
          <b-badge class="pml-2" variant="info" :href="phoneLookup" size="sm">
            <font-awesome-layers>
              <font-awesome-icon icon="phone-alt"></font-awesome-icon>
            </font-awesome-layers>
            411
          </b-badge>
        </div>
      </div>
      <div class="static-buttons col-3 pl-0 pr-2" v-show="!isLeftPanelOpen">
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
      <SlidePanel
        class="left-panel pl-0 pr-2"
        :name="'leftPanel'"
        ref="leftPanel"
        :direction="'left'"
        v-on:left-panel-open="openLeftPanel"
        v-on:left-panel-close="closeLeftPanel">
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
          tabindex="-1"
          @click="setAddress(address)">
          <font-awesome-layers class="text-info fa-2x">
            <font-awesome-icon icon="history"></font-awesome-icon>
          </font-awesome-layers>
        </b-link>
      </SlidePanel>
    </div>
  </v-touch>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import SlidePanel from './SlidePanel';
import ActivityButton from './ActivityButton';

const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW', 'NF'];

export default {
  name: 'AddressCard',
  props: ['address', 'territoryId'],
  components: {
    SlidePanel,
    ActivityButton,
  },
  data() {
    return {
      storageId: `foreignfield-${this.address.id}`,
      selectedResponse: '',
      responseText: '',
      isLeftPanelOpen: false,
      clickedResponse: '',
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
      setAddress: 'address/setAddress',
      fetchAddress: 'address/fetchAddress',
    }),
    closeLeftPanel() {
      this.isLeftPanelOpen = false;
    },
    openLeftPanel() {
      this.isLeftPanelOpen = true;
    },
    async updateResponse(value) {
      if (this.selectedResponse === 'START' && value === 'START') return;

      this.clickedResponse = value;

      try {
        await this.addLog({ addressId: this.address.id, value });
        await this.fetchAddress(this.address.id);
        this.selectedResponse = this.lastActivity;
        this.clickedResponse = '';
        this.$refs.leftPanel.close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    slideLeft(e) {
      if (this.isLeftPanelOpen) {
        this.closeLeftPanel();
      } else {
        this.$refs.leftPanel.slide(e);
      }
    },
    slideRight(e) {
      this.$refs.leftPanel.slide(e);
    },
  },
  mounted() {
    this.closeLeftPanel();
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
.left-panel {
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
  min-height: 50px;
  height: 100%;
}

.left-panel * {
  display: block;
}
.left-panel .buttons {
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
