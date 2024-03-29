<template>
  <div>
    <div class="lead pt-3">Search</div>
    <div class="w-100 justify-content-center pb-3">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
      <search-bar
        class="w-100 p-3"
        :search-text="'Search address or territory'"
        :model="text"
        @on-click="clickedSearch"
        :no-padding="true"
      />
    </div>
    <div class="row w-100 mx-0">
      <b-list-group class="col-sm-12 col-md-6 px-0">
        <div class="text-uppercase pt-4">Addresses</div>
        <b-list-group-item v-for="address in addresses" :key="address.id">
          <div class="text-left">
            <b-link :to="link(address)">
              <div>{{address.addr1}} {{address.addr2}}</div>
              <div>{{address.city}}, {{address.state_province}} {{address.postal_code}}</div>
            </b-link>
            <b-badge v-if="isUnassigned(address)" variant="warning" class="text-lowercase">
              unassigned
            </b-badge>
            <!-- <b-badge v-if="isNF(address)" variant="danger" class="text-lowercase">
              {{formatLanguage(statusText(address.status), language)}}
            </b-badge> -->
            <b-badge v-if="isDNC(address)" variant="danger" class="text-lowercase">
              {{ADDRESS_STATUS.DNC.text}}
            </b-badge>
            <b-badge v-if="isInactive(address)" variant="danger" class="text-lowercase">
              {{formatLanguage(statusText(address.status), language)}}
            </b-badge>
            <div v-else>{{get(address, 'territory.name')}}</div>
          </div>
        </b-list-group-item>
        <b-list-group-item v-for="phone in phones" :key="phone.id">
          <div class="text-left">
            <b-link :to="link(phone.address)">
              <div>{{get(phone, 'address.addr1')}} {{get(phone, 'address.addr2')}}</div>
              <div>
                {{get(phone, 'address.city')}}, {{get(phone, 'address.state_province')}}
                {{get(phone, 'address.postal_code')}}
              </div>
              <div>{{formatPhone(phone.phone)}}</div>
            </b-link>
            <div>({{get(phone, 'territory.name')}})</div>
          </div>
        </b-list-group-item>
      </b-list-group>
      <b-list-group class="col-sm-12 col-md-6 px-0">
        <div class="text-uppercase pt-4">Territories</div>
        <b-list-group-item v-for="terr in allTerritories" :key="terr.id">
          <div class="text-left">
            <b-link :to="`/territories/${terr.id}`">
              {{terr.name}} {{terr.description}}
            </b-link>
          </div>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import SearchBar from './SearchBar';
import { ADDRESS_STATUS } from '../store/modules/models/AddressModel';
import { formatLanguage } from '../utils/tags';
import { format as formatPhone } from '../utils/phone';

export default {
  name: 'SearchResults',
  props: ['keyword'],
  components: {
    SearchBar,
  },
  data() {
    return {
      loading: false,
      isEmpty: true,
      isDirty: false,
      text: this.$route.params.keyword,
      id: this.$route.params.id,
      ADDRESS_STATUS,
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      addresses: 'addresses/search',
      allTerritories: 'territories/allTerritories',
      phones: 'phone/search',
      canWrite: 'auth/canWrite',
      congregation: 'congregation/congregation',
    }),
    language() {
      return (get(this.congregation, 'language') || 'Tagalog');
    },
  },
  methods: {
    ...mapActions({
      addressSearch: 'addresses/addressSearch',
      fetchAllTerritories: 'territories/fetchAllTerritories',
      phoneSearch: 'phone/phoneSearch',
    }),
    get,
    formatLanguage,
    formatPhone,
    reset() {
      this.text = '';
    },
    compareToKeyword(filter, values) {
      return values.reduce(
        (acc, value) => acc || String(value).toLowerCase().includes(filter.toLowerCase()),
        false,
      );
    },
    async search(_keyword) {
      const congId = get(this.congregation, 'id');
      const keyword = _keyword || this.keyword;
      this.text = keyword;
      await this.addressSearch({ congId, searchTerm: keyword, status: '*' });
      await this.fetchAllTerritories({ congId, keyword });

      const phone = keyword.replace(/\W/g, '');
      await this.phoneSearch({ congId, searchTerm: phone, status: '*' });
    },
    async clickedSearch(keyword) {
      this.$router.push({ name: 'search', params: { keyword } });
    },
    isUnassigned(address) {
      return get(address, 'territory_id') === 0;
    },
    // isNF(address) {
    //   return get(address, 'status') === ADDRESS_STATUS.NF.value;
    // },
    isDNC(address) {
      return get(address, 'status') === ADDRESS_STATUS.DNC.value;
    },
    isInactive(address) {
      return get(address, 'status') === ADDRESS_STATUS.Inactive.value;
    },
    isDisabled(address) {
      return this.isUnassigned(address)
        // || this.isNF(address)
        || this.isDNC(address)
        || this.isInactive(address);
    },
    statusText(status) {
      return ADDRESS_STATUS[status].text;
    },
    link(address) {
      if (!address) return null;
      if (this.isDisabled(address)) {
        return `/territories/${address.territory_id}/addresses/${address.id}/edit`;
      }

      const defaultView = get(this.congregation, 'options.territory.defaultView');
      return {
        name: defaultView,
        params: { territoryId: address.territory_id },
        query: { addressId: address.id },
      };
    },
  },
  async mounted() {
    await this.search(this.keyword);
  },
  watch: {
    async congregation() {
      await this.search(this.keyword);
    },
  },
};
</script>

<style scoped>
  .search {
    font-size: 23px;
  }
</style>
