<template>
  <div class="phone-witnessing w-100 d-flex flex-row flex-wrap">
    <SearchBar class="w-100" :search-text="'Search this territory'" @on-click="search" top="176px"></SearchBar>
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
import get from 'lodash/get';
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
  beforeRouteLeave(to, from, next) {
    const token = get(this.territoryCancelTokens, 'FETCH_LAST_ACTIVITY');
    if (token) token.cancel();
    next();
  },
  props: ['territory', 'id', 'disabled'],
  async mounted() {
    channel.bind('add-log', async (log) => {
      if (this.territory && this.territory.addresses) {
        const phoneAddress = this.territory.addresses.find(a => a.id === log.parent_id);
        if (phoneAddress) {
          const id = log.address_id;
          const phone = phoneAddress.phones.find(p => p.id === id);
          if (phone) {
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

    if (this.$route.query.addressId) {
      this.foundId = Number.parseInt(this.$route.query.addressId, 10);
      this.scrollToView();
    }
  },
  data() {
    return {
      reset: false,
      workInProgress: {},
      foundId: 0,
      isLoading: true,
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      token: 'auth/token',
      canCheckout: 'auth/canCheckout',
      phone: 'phone/phone',
      territoryIsLoading: 'territory/isLoading',
      territoryCancelTokens: 'territory/cancelTokens',
    }),
    lastActivity() {
      return this.territory.lastActivity;
    },
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
    addressCount() {
      return get(this.territory, 'addresses.length') || 0;
    },
  },
  methods: {
    ...mapActions({
      resetNHRecords: 'territory/resetNHRecords',
      fetchPhone: 'address/fetchAddress',
    }),

    search(_keyword) {
      this.foundId = 0;
      if (!_keyword) {
        this.foundId = 0;
        return;
      }
      const keyword = _keyword.toLowerCase();
      const foundAddress = this.territory.addresses.find(a => this.compareToKeyword(
        keyword,
        [a.addr1, a.addr2, a.city, a.notes],
      ));
      const foundPhone = !foundAddress
        ? this.territory.addresses.find(a => a.phones.find(p => this.compareToKeyword(keyword, [p.phone, p.notes])))
        : null;

      this.foundId = foundAddress && foundAddress.id || foundPhone && foundPhone.id || 0;
      this.scrollToView();
    },

    scrollToView() {
      const ref = this.$refs[`phone-address-${this.foundId}`];
      const card = ref && ref.length && ref[0];
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
