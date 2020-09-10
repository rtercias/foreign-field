<template>
  <div class="territory">
    <Loading v-if="isLoading"></Loading>
    <b-list-group v-else>
      <swipe-list
        ref="list"
        class="card"
        :items="territory.addresses"
        item-key="id"
        data-toggle="collapse">
        <template v-slot="{ item, revealRight, close }">
          <AddressCard
            :class="isActiveAddress(item.id) ? ['bg-white border-warning border-medium', 'active'] : []"
            :address="item"
            :reset="reset"
            :territoryId="id"
            :group="group"
            :incomingResponse="item.incomingResponse"
            :openRight="revealRight"
            :closeRight="close">
          </AddressCard>
          <AddressTags :address="address" v-on="$listeners"></AddressTags>
        </template>
        <template v-slot:right="{ item, revealRight, close }">
          <AddressActivityButtons
            :address="item"
            :show="() => revealRight()"
            :isTerritoryCheckedOut="isTerritoryCheckedOut"
            @update-response="(value) => updateResponse(item, value, close)">
          </AddressActivityButtons>
        </template>
      </swipe-list>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import differenceInDays from 'date-fns/differenceInDays';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import { SwipeList } from 'vue-swipe-actions';
import AddressCard from './AddressCard';
import AddressActivityButtons from './AddressActivityButtons';
import AddressTags from './AddressTags';
import Loading from './Loading.vue';
import { channel } from '../main';

export default {
  name: 'TerritoryAddresses',
  components: {
    SwipeList,
    AddressCard,
    AddressActivityButtons,
    AddressTags,
    Loading,
  },
  props: ['group', 'id'],
  async mounted() {
    channel.bind('add-log', (log) => {
      const address = this.territory.addresses.find(a => a.id === log.address_id);
      if (address) {
        this.$set(address, 'incomingResponse', log);
      }
    });
    if (this.canCheckout) {
      this.setLeftNavRoute(`/territories/${this.group}`);
    } else {
      this.setLeftNavRoute('/');
    }
    await this.loadTerritory();
  },
  data() {
    return {
      isLoading: true,
      reset: false,
      workInProgress: {},
    };
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
      user: 'auth/user',
      token: 'auth/token',
      authLoading: 'auth/loading',
      canCheckout: 'auth/canCheckout',
      actionButtonList: 'address/actionButtonList',
      address: 'address/address',
    }),
    lastActivity() {
      return this.territory.lastActivity;
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      resetNHRecords: 'territory/resetNHRecords',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
    }),

    isActiveAddress(addressId) {
      return this.lastActivity ? addressId === this.lastActivity.address_id : false;
    },

    async refreshTerritory(_address) {
      if (_address) {
        const index = this.territory.addresses.findIndex(a => a.id === _address.id);
        this.territory.addresses.splice(index, 1, _address);
        this.territory.lastActivity = { address_id: _address.id, ..._address.lastActivity };
      } else {
        await this.getTerritory(this.id);
      }
    },

    seenTerritories() {
      let seenTerritories = [];
      if (localStorage.getItem('seenTerritories')) {
        try {
          seenTerritories = JSON.parse(localStorage.getItem('seenTerritories'));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
      return seenTerritories;
    },
    saveSeenTerritory() {
      // create a basic territory and save it to localstorage
      const city = Array.isArray(this.territory.city) && this.territory.city.length ? this.territory.city.split(',')[0] : '';
      const basicTerritory = {
        name: this.territory.name,
        city,
        group_code: this.territory.group_code,
        id: this.territory.id,
        lastVisited: (new Date()).toISOString(),
      };
      let seenList = this.seenTerritories();
      const idx = seenList.findIndex(terr => terr.id === this.territory.id);
      if (idx >= 0) {
        seenList.splice(idx, 1, basicTerritory);
      } else {
        seenList.push(basicTerritory);
      }
      // filter out old ones
      seenList = seenList.filter(terr => differenceInDays(new Date(), new Date(terr.lastVisited)) < 60);
      seenList = orderBy(seenList, 'lastVisited', 'desc');
      seenList.length = seenList.length <= 5 ? seenList.length : 5;
      const parsed = JSON.stringify(seenList);
      localStorage.setItem('seenTerritories', parsed);
    },
    async loadTerritory() {
      if (this.token) {
        await this.getTerritory(this.id);
        this.saveSeenTerritory();
      }
      this.isLoading = false;
    },
    isTerritoryCheckedOut() {
      return get(this.territory, 'status.status') === 'Checked Out';
    },
    async updateResponse(address, _value, close) {
      this.isLogging = true;
      let value = _value;
      this.setAddress(address);

      if (address.selectedResponse === 'START' && value === 'START') return;

      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        await this.addLog({ addressId: this.address.id, value });
        if (this.address.lastActivity) {
          const { lastActivity } = this.address;
          this.$set(address, 'selectedResponse', lastActivity.value);
          this.$set(address, 'selectedResponseTS', lastActivity.timestamp);
        }
        // this.refreshTerritory(address);

        close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      } finally {
        this.isLogging = false;
      }
    },
  },
  watch: {
    async token() {
      await this.loadTerritory();
    },
    immediate: true,
  },
};
</script>

<style lang="scss">
@import "../assets/foreign-field-theme.scss";
.list-group {
  display: block;

  .swipeout-list-item {
    border-top: 1px solid $secondary;
    border-bottom: 1px solid $secondary;
  }
}

.columns {
  columns: 1;
}
.columns > [class*="col-"] {
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    break-inside: avoid;
    width: 100%;
    float: none;
}
.list-group-item.item.border-medium {
  border-width: medium;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.add-new {
    font-size: 24px;
  }
@media (min-width: 769px) {
  .list-group {
    .swipeout-list {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      padding: 5px;

      .swipeout-list-item {
        width: 49%;
        flex: auto;
        margin: 5px;
        border: 1px solid $secondary;
      }
    }
  }
}
@media print {
  .columns {
    columns: 2;
  }
}
</style>
