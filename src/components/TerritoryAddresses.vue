<template>
  <div class="territory-addresses pb-5">
    <SearchBar :search-text="'Search this territory'" @on-click="search" top="176px"></SearchBar>
    <!-- <h3 v-if="territory.addresses.length === 0" class="w-100 text-center">
      There are no addresses in this territory.
    </h3> -->
    <b-list-group>
      <swipe-list
        ref="list"
        class="card"
        :items="territory.addresses"
        item-key="id"
        :revealed.sync="revealed"
        :disabled="disabled"
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
            :territoryId="territoryId"
            :incomingResponse="item.lastActivity"
            :revealed="revealed"
            :disabled="disabled"
            @update-response="updateResponse"
            @toggle-right-panel="openSwipe">
          </AddressCard>
        </template>
        <template v-slot:right="{ item, close }">
          <ActivityButton
            v-for="(button, index) in containerButtonList"
            :key="index"
            class="fa-2x"
            :value="button.value"
            :actionButtonList="actionButtonList"
            :slashed="button.value === 'LW' && doNotMail"
            :disabled="disabled || (button.value === 'LW' && doNotMail)"
            @button-click="() => updateResponse(item, button.value, close)">
          </ActivityButton>
        </template>
      </swipe-list>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import { SwipeList } from 'vue-swipe-actions';
import AddressCard from './AddressCard';
import ActivityButton from './ActivityButton';
import AddressTags from './AddressTags';
import Loading from './Loading.vue';
import SearchBar from './SearchBar';

const BUTTON_LIST = ['NH', 'HOME', 'LW'];

export default {
  name: 'TerritoryAddresses',
  props: ['territory', 'territoryId', 'disabled'],
  components: {
    SwipeList,
    AddressCard,
    ActivityButton,
    AddressTags,
    Loading,
    SearchBar,
  },
  beforeRouteLeave(to, from, next) {
    const token = get(this.territoryCancelTokens, 'FETCH_LAST_ACTIVITY');
    if (token) token.cancel();
    next();
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
      user: 'auth/user',
      token: 'auth/token',
      authLoading: 'auth/loading',
      canCheckout: 'auth/canCheckout',
      actionButtonList: 'address/actionButtonList',
      address: 'address/address',
      territoryCancelTokens: 'territory/cancelTokens',
    }),
    lastActivity() {
      return this.territory.lastActivity;
    },
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
    doNotMail() {
      return (get(this.address, 'notes') || '').includes('do not mail');
    },
  },
  methods: {
    ...mapActions({
      resetNHRecords: 'territory/resetNHRecords',
      setAddress: 'address/setAddress',
      addLog: 'address/addLog',
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

    async updateResponse(address, _value, close) {
      let value = _value;
      this.setAddress(address);

      if (address.selectedResponse === 'START' && value === 'START') return;

      if (!this.actionButtonList.some(b => b.value === value)) {
        value = 'START';
      }

      try {
        await this.addLog({ entityId: address.id, value });
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
      const foundAddress = this.territory.addresses.find(a => this.compareToKeyword(
        keyword,
        [a.addr1, a.addr2, a.city, a.notes],
      ));
      this.foundId = foundAddress && foundAddress.id || 0;
      const card = this.$refs[`address-${this.foundId}`];
      if (card && card.$el) card.$el.scrollIntoView(false);
    },
    compareToKeyword(keyword, values) {
      return values.reduce(
        (acc, value) => acc || String(value).toLowerCase().includes(keyword.toLowerCase()),
        false,
      );
    },
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
