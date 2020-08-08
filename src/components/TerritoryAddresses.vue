<template>
  <div class="territory">
    <Loading v-if="isLoading"></Loading>
    <b-list-group v-else class="columns">
      <b-list-group-item
        class="item col-sm-12 overflow-auto"
        v-for="address in territory.addresses"
        :class="isActiveAddress(address.id) ? ['bg-white border-warning border-medium', 'active'] : []"
        v-bind:key="address.id"
        data-toggle="collapse">
        <AddressCard
          v-bind="{address, reset}"
          :territoryId="id"
          :group="group"
          :incomingResponse="address.incomingResponse"
          @address-updated="refreshTerritory">
        </AddressCard>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AddressCard from './AddressCard.vue';
import Loading from './Loading.vue';
import { channel } from '../main';

export default {
  name: 'TerritoryAddresses',
  components: {
    AddressCard,
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

    async loadTerritory() {
      await this.getTerritory(this.id);
      this.isLoading = false;
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.list-group {
  display: block;
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
  .columns {
    columns: 2;
  }
}
@media print {
  .columns {
    columns: 2;
  }
}
</style>
