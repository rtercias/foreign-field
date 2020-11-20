<template>
  <Loading class="w-100" v-if="isLoading"></Loading>
  <div v-else class="phone-witnessing d-flex flex-row flex-wrap align-items-baseline">
    <SearchBar class="w-100" :search-text="'Search this territory'" @on-click="search"></SearchBar>
    <PhoneAddressCard
      v-for="(a, index) in territory.addresses" :key="a.id"
      :ref="`phone-address-${a.id}`"
      class="phone-address-card-container"
      :class="{ 'border-success border-medium': a.id === foundId }"
      :address="a"
      :territory="territory"
      :index="index"
      :disabled="disabled">
    </PhoneAddressCard>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import differenceInDays from 'date-fns/differenceInDays';
import orderBy from 'lodash/orderBy';
import PhoneAddressCard from './PhoneAddressCard';
import SearchBar from './SearchBar';
import Loading from './Loading.vue';
import { channel } from '../main';

const BUTTON_LIST = ['NH', 'HOME', 'PH', 'LW'];
export default {
  name: 'PhoneWitnessing',
  components: {
    PhoneAddressCard,
    SearchBar,
    Loading,
  },
  props: ['group', 'id', 'disabled'],
  async mounted() {
    channel.bind('add-log', async (log) => {
      if (this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.id === log.parent_id);
        if (address) {
          const id = log.address_id;
          const phone = address.phones.find(p => p.id === id);
          if (phone) {
            this.$set(phone, 'incomingResponse', log.value);
            this.$set(phone, 'lastActivity', log);
          }
        }
      }
    });
    channel.bind('add-phone-tag', (args) => {
      if (args && this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.phones.some(p => p.id === args.phoneId));
        const phone = address && address.phones.find(p => p.id === args.phoneId);
        if (phone) this.$set(phone, 'notes', args.notes);
      }
    });
    channel.bind('remove-phone-tag', (args) => {
      if (args && this.territory && this.territory.addresses) {
        const address = this.territory.addresses.find(a => a.phones.some(p => p.id === args.phoneId));
        const phone = address && address.phones.find(p => p.id === args.phoneId);
        if (phone) this.$set(phone, 'notes', args.notes);
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
      phone: 'phone/phone',
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
      fetchPhone: 'phone/fetchPhone',
    }),
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
      const foundPhone = !foundAddress
        ? this.territory.addresses.find(a => a.phones.find(p => p.phone.toLowerCase().includes(keyword)
          || p.notes.toLowerCase().includes(keyword)))
        : null;

      this.foundId = foundAddress && foundAddress.id || foundPhone && foundPhone.id || 0;
    },
  },
  watch: {
    async token() {
      this.isLoading = true;
      await this.loadTerritory();
    },
    foundId(value) {
      const ref = this.$refs[`phone-address-${value}`];
      const card = ref && ref.length && ref[0];
      if (card && card.$el) card.$el.scrollIntoView();
    },
    immediate: true,
  },
};
</script>

<style lang="scss" scoped>
@import "../assets/foreign-field-theme.scss";
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
  .phone-address-card-container {
    width: 49%;
    flex: auto;
    margin: 5px;
    border: 1px solid $secondary;
  }
}

@media print {
  .columns {
    columns: 2;
  }
}
</style>
