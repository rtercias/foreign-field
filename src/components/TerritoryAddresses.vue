<template>
  <div class="territory-addresses pb-5">
    <Loading v-if="isLoading"></Loading>
    <div v-else>
      <SearchBar :search-text="'Search this territory'" @on-click="search"></SearchBar>
      <b-list-group>
        <swipe-list
          ref="list"
          class="card"
          :items="territory.addresses"
          item-key="id"
          :revealed.sync="revealed"
          data-toggle="collapse"
          @active="closeSwipes">
          <template v-slot="{ item, index, revealed }">
            <AddressCard
              :ref="`address-${item.id}`"
              :index="index"
              :class="{
                'bg-white border-warning border-medium active': isActiveAddress(item.id),
                'border-success border-medium': item.id === foundId
              }"
              :address="item"
              :reset="reset"
              :territoryId="id"
              :group="group"
              :incomingResponse="item.incomingResponse"
              :revealed="revealed"
              @update-response="updateResponse"
              @togglePanel="openSwipe">
            </AddressCard>
          </template>
          <template v-slot:right="{ item, close }" v-if="isTerritoryCheckedOut">
            <ActivityButton
              v-for="(button, index) in containerButtonList"
              :key="index"
              class="fa-2x"
              :value="button.value"
              :actionButtonList="actionButtonList"
              @button-click="() => updateResponse(item, button.value, close)">
            </ActivityButton>
          </template>
        </swipe-list>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import differenceInDays from 'date-fns/differenceInDays';
import orderBy from 'lodash/orderBy';
import get from 'lodash/get';
import { SwipeList } from 'vue-swipe-actions';
import AddressCard from './AddressCard';
import ActivityButton from './ActivityButton';
import AddressTags from './AddressTags';
import Loading from './Loading.vue';
import SearchBar from './SearchBar';
import { channel } from '../main';

const BUTTON_LIST = ['NH', 'HOME', 'LW'];

export default {
  name: 'TerritoryAddresses',
  components: {
    SwipeList,
    AddressCard,
    ActivityButton,
    AddressTags,
    Loading,
    SearchBar,
  },
  props: ['group', 'id'],
  async mounted() {
    channel.bind('add-log', (log) => {
      if (log && this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === log.address_id);
        if (address) {
          this.$set(address, 'incomingResponse', log);
        }
      }
    });
    channel.bind('add-note', (args) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === args.addressId);
        if (address && !address.notes.includes(args.note)) {
          const notesArray = address.notes ? address.notes.split(',') : [];
          notesArray.push(args.note);
          this.$set(address, 'notes', notesArray.join(','));
        }
      }
    });
    channel.bind('remove-note', (args) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === args.addressId);
        if (address && address.notes.includes(args.note)) {
          const notesArray = address.notes ? address.notes.split(',') : [];
          const filtered = notesArray.filter(n => n !== args.note);
          this.$set(address, 'notes', filtered.join(','));
        }
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
      revealed: {},
      foundId: 0,
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
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
  },
  methods: {
    ...mapActions({
      getTerritory: 'territory/getTerritory',
      resetNHRecords: 'territory/resetNHRecords',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
      fetchAddress: 'address/fetchAddress',
    }),

    openSwipe(index, revealed) {
      if (revealed) {
        this.$refs.list.closeActions(index);
      } else {
        this.$refs.list.closeActions();
        this.$refs.list.revealRight(index);
      }
    },
    closeSwipes() {
      this.$refs.list.closeActions();
    },

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
      let value = _value;
      this.setAddress(address);

      if (address.selectedResponse === 'START' && value === 'START') return;

      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        await this.addLog({ entityId: address.id, value });
        await this.fetchAddress(address.id);
        const updatedAddress = this.territory.addresses.find(a => a.id === address.id);
        updatedAddress.lastActivity = {
          publisher_id: this.user.id,
          address_id: address.id,
          timestamp: Date.now(),
          value,
        };

        this.territory.lastActivity = updatedAddress.lastActivity;

        if (typeof close === 'function') close();
      } catch (e) {
        console.error('Unable to save activity log', e);
      }
    },
    search(_keyword) {
      if (!_keyword) {
        this.foundId = 0;
        return;
      }
      const keyword = _keyword.toLowerCase();
      const foundAddress = this.territory.addresses.find(a => a.addr1.toLowerCase().includes(keyword)
        || a.addr2.toLowerCase().includes(keyword)
        || a.city.toLowerCase().includes(keyword)
        || a.notes.toLowerCase().includes(keyword));

      this.foundId = foundAddress && foundAddress.id || 0;
    },
  },
  watch: {
    async token() {
      await this.loadTerritory();
    },
    foundId(value) {
      const card = this.$refs[`address-${value}`];
      if (card && card.$el) card.$el.scrollIntoView();
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
    min-height: 80px;
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
