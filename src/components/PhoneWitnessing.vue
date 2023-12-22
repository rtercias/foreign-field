<template>
  <div class="phone-witnessing w-100 d-flex flex-row flex-wrap bg-light">
    <SearchBar
      class="w-100"
      :search-text="'Search this territory'"
      @on-click="search"
      @on-filter="filter"
      :model="keywordFilter"
      :results="filteredAddresses"
      :allow-exclude="true"
      top="172px"
    />
    <PhoneAddressCard
      v-for="(a, index) in filteredAddresses" :key="a.id"
      :ref="`phone-address-${a.id}`"
      class="phone-address-card-container mx-2 mb-2 bg-white"
      :class="{
        'border-success border-medium': a.id === foundId,
        'border': $route.name === 'address-list',
      }"
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
    if (token && this.isTerritoryBusy) {
      token.cancel();
      this.cancelFetchLastActivity();
    }
    next();
  },
  props: ['territory', 'id', 'disabled'],
  async mounted() {
    window.scrollTo(0, this.scrollYPosition[this.$route.path] || 0);
    this.keywordFilter = this.savedFilter.keyword;
    this.exclude = this.savedFilter.exclude;
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
      keywordFilter: '',
      exclude: false,
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      token: 'auth/token',
      canCheckout: 'auth/canCheckout',
      isDesktop: 'auth/isDesktop',
      phone: 'phone/phone',
      territoryIsLoading: 'territory/isLoading',
      isTerritoryBusy: 'territory/isBusy',
      territoryCancelTokens: 'territory/cancelTokens',
      savedFilter: 'territory/filter',
      scrollYPosition: 'auth/scrollYPosition',
    }),
    lastActivity() {
      return this.territory.lastActivity;
    },
    containerButtonList() {
      return this.actionButtonList.filter(b => BUTTON_LIST.includes(b.value));
    },
    addressCount() {
      return get(this.filteredAddresses, 'length') || 0;
    },
    filteredAddresses() {
      const keyword = this.keywordFilter.toLowerCase();
      const addresses = get(this.territory, 'addresses') || [];
      return addresses.filter((a) => {
        const phoneFound = a.phones.find(p => this.compareToKeyword(keyword, [p.phone, p.notes]));
        const addressFound = this.compareToKeyword(
          keyword,
          [a.addr1, a.addr2, a.city, a.notes],
        );
        return this.exclude !== (phoneFound || addressFound);
      });
    },
  },
  methods: {
    ...mapActions({
      resetNHRecords: 'territory/resetNHRecords',
      fetchPhone: 'address/fetchAddress',
      cancelFetchLastActivity: 'territory/cancelFetchLastActivity',
      setFilter: 'territory/setFilter',
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

    filter(_keyword, exclude) {
      this.keywordFilter = _keyword;
      this.exclude = exclude;
      this.setFilter({ keyword: _keyword, exclude });
      this.$emit('update-count', this.filteredAddresses.length);
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

.phone-address-card-container {
  width: 100%;
}

@media (min-width: 769px) {
  .phone-address-card-container {
    width: 48%;
    flex: auto;
    border: 1px solid $secondary;
  }
}

@media (min-width: 1400px) {
  .phone-address-card-container {
    width: 32%;
  }
}

@media print {
  .columns {
    columns: 2;
  }
}
</style>
