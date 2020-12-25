<template>
  <div>
    <div class="lead pt-3">Search</div>
    <div class="w-100 justify-content-center pb-3">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
      <search-bar
        class="w-100 p-3"
        :search-text="'Search address or territory'"
        :model="text"
        @on-click="search"
        :no-padding="true"
      />
    </div>
    <div class="row w-100 mx-0">
      <b-list-group class="col-sm-12 col-md-4 px-0">
        <div class="text-uppercase pt-4">Addresses</div>
        <b-list-group-item v-for="address in addresses" :key="address.id">
          <div>
            <b-link :to="`/territories/${address.territory_id}/phone?addressId=${address.id}`">
              {{address.addr1}} {{address.addr2}}
              {{address.city}}, {{address.state_province}} {{address.postal_code}}
            </b-link>
          </div>
        </b-list-group-item>
      </b-list-group>
      <b-list-group class="col-sm-12 col-md-4 px-0">
        <div class="text-uppercase pt-4">Territories</div>
        <b-list-group-item v-for="terr in territories" :key="terr.id">
          <div>
            <b-link :to="`/groups/${terr.group_id}?territory=${terr.name}`">
              {{terr.name}} {{terr.description}}
            </b-link>
          </div>
        </b-list-group-item>
      </b-list-group>
      <b-list-group class="col-sm-12 col-md-4 px-0">
        <div class="text-uppercase pt-4">DNC</div>
        <b-list-group-item v-for="addr in filteredDnc" :key="addr.id">
          <div>
            <!-- <b-link :to="`/territories/${addr.territory_id}/phone?addressId=${addr.id}`"> -->
            {{addr.addr1}} {{addr.addr2}}
            {{addr.city}}, {{addr.state_province}} {{addr.postal_code}}
            <!-- </b-link> -->
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
    };
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      dnc: 'addresses/dnc',
      addresses: 'addresses/search',
      territories: 'territories/territories',
    }),
    filteredDnc() {
      if (!this.text || this.text === '') {
        return [];
      }
      return this.dnc.filter(d => this.compareToKeyword(this.text, [d.addr1, d.addr2]));
    },
  },
  methods: {
    ...mapActions({
      getDnc: 'addresses/getDnc',
      addressSearch: 'addresses/addressSearch',
      fetchAllTerritories: 'territories/fetchAllTerritories',
    }),
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
      const congId = get(this.user, 'congregation.id');
      const keyword = _keyword || this.keyword;
      this.text = keyword;
      await this.addressSearch({ congId, searchTerm: keyword });
      await this.fetchAllTerritories({ congId, keyword });
      await this.getDnc({ id: congId, keyword });
    },
  },
  async mounted() {
    await this.search();
  },
};
</script>

<style scoped>
  .search {
    font-size: 23px;
  }
</style>
