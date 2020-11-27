<template>
  <div class="territories" :key="groupCode">
    <header class="d-flex flex-column align-items-center px-3 pt-0">
      <div class="row w-100 pb-1">
        <b-dropdown class="col-sm-12 col-md-3 group-codes px-0 py-2" :text="`Service Group: ${selectedGroup}`">
          <b-dropdown-item
            v-for="group in groupCodes"
            :key="group"
            :to="{ name: 'group', params: { groupCode: group } }"
            class="m-0 w-100">
            <font-awesome-icon icon="check" v-if="group === selectedGroup" /> {{group}}
          </b-dropdown-item>
        </b-dropdown>
        <div v-if="isCampaignMode" class="col-sm-12 col-md-9 text-right px-0 py-2">
          <span class="small pr-1">Campaign Status:</span>
          <b-badge class="bg-white p-2 border-medium border-secondary">Remainder ({{count('Available')}})</b-badge>
          <b-badge class="alert-warning p-2 border-medium">In progress ({{count('Checked Out')}})</b-badge>
          <b-badge class="alert-success p-2 border-medium">Completed ({{count('Recently Worked')}})</b-badge>
        </div>
      </div>
      <SearchBar
        class="w-100"
        :search-text="'Filter by territory name or description'"
        :results="filteredTerritories"
        allow-exclude="true"
        @on-change="applyFilter">
      </SearchBar>
      <div class="d-flex w-100 justify-content-between w-100">
        <b-dropdown right variant="secondary">
          <span slot="button-content">
            <font-awesome-icon icon="filter" />
            {{availability}}
          </span>
          <b-dropdown-item
            class="availability-filter p-0"
            v-for="avail in availabilityFilters"
            v-bind:key="avail"
            @click="() => setAvailability(avail)">
            <font-awesome-icon class="selected" icon="check" v-if="availability === avail" />
            {{avail}}
          </b-dropdown-item>
        </b-dropdown>
        <b-dropdown class="sort-btn" right variant="secondary">
          <span slot="button-content">
            <font-awesome-icon icon="sort-amount-down-alt" />
            {{sortOption}}
          </span>
          <b-dropdown-item v-for='option in sortOptions' :key="option" @click="() => sort(option)">
            <font-awesome-icon class="selected" icon="check" v-if="sortOption === option" /> {{option}}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </header>
    <Loading v-if="loading"></Loading>
    <div v-else>
      <b-list-group class="columns flex-row flex-wrap">
        <b-list-group-item
          v-for="terr in filteredTerritories"
          v-bind:key="terr.id"
          data-toggle="collapse"
          class="territory-card col-md-6 col-lg-3 px-4"
          :class="{
            'list-group-item-success': isCampaignMode && get(terr, 'status.status') === 'Recently Worked',
            'list-group-item-warning': isCampaignMode && get(terr, 'status.status') === 'Checked Out'
          }">
          <TerritoryCard :terr="terr" :groupCode="terr.group" :selectTerritory="selectTerritory" :fetch="fetch">
          </TerritoryCard>
        </b-list-group-item>
      </b-list-group>
      <CheckoutModal :territory="selectedTerritory"></CheckoutModal>
    </div>
    <span class="p-2" v-if="!loading && filteredTerritories && filteredTerritories.length === 0">
      There are no {{availability}} territories
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import TerritoryCard from './TerritoryCard.vue';
import CheckoutModal from './CheckoutModal.vue';
import SearchBar from './SearchBar';
import Loading from './Loading.vue';
import orderBy from 'lodash/orderBy';

const DEFAULT_FILTER = 'All';

export default {
  name: 'Territories',
  props: ['groupCode'],
  components: {
    TerritoryCard,
    CheckoutModal,
    Loading,
    SearchBar,
  },

  data() {
    return {
      selectedTerritory: {},
      selectedGroup: '',
      keywordFilter: '',
      excludeKeyword: false,
      cities: [],
      availability: '',
      availabilityFilters: [
        'All',
        'Available',
        'Checked Out',
        'Recently Worked',
      ],
      sortOption: 'Description',
      sortOptions: [
        'Name',
        'Description',
      ],
      loading: true,
    };
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
      token: 'auth/token',
      territories: 'territories/territories',
      groups: 'auth/groupCodes',
    }),
    searchedTerritories() {
      const { territories = [] } = this;
      if (this.keywordFilter) {
        return territories.filter(t => this.excludeKeyword !== this.compareToKeyword([t.name, t.description]));
      }
      return territories;
    },
    filteredTerritories() {
      if (this.availability === 'All') {
        const allTerrs = this.searchedTerritories;
        return orderBy(allTerrs, this.sortOption.toLowerCase());
      }
      const filtered = this.searchedTerritories && this.searchedTerritories.filter(
        t => get(t, 'status.status') === this.availability
      );
      return orderBy(filtered, this.sortOption.toLowerCase());
    },
    isCampaignMode() {
      return get(this.user, 'congregation.campaign') || false;
    },
    groupCodes() {
      return ['ALL', ...this.groups];
    },
  },

  watch: {
    congId() {
      if (!this.congId) return;
      this.fetch();
    },
  },

  methods: {
    get,
    selectTerritory(territory) {
      this.selectedTerritory = territory;
    },

    async setAvailability(value) {
      this.availability = value;
      sessionStorage.setItem('availability', value);
    },

    sort(value) {
      this.sortOption = value;
    },

    async fetch() {
      const congId = this.congId || (this.user && this.user.congId);
      this.selectedGroup = this.groupCode;
      this.loading = true;
      this.availability = sessionStorage.getItem('availability') || DEFAULT_FILTER;
      await this.$store.dispatch('territories/fetchTerritories', {
        congId,
        groupCode: this.selectedGroup === 'ALL' ? '' : this.selectedGroup,
      });
      this.loading = false;
    },

    applyFilter(value, exclude) {
      this.keywordFilter = value;
      this.excludeKeyword = exclude;
    },

    compareToKeyword(values) {
      return values.reduce(
        (acc, value) => acc || String(value).toLowerCase().includes(this.keywordFilter.toLowerCase()),
        false,
      );
    },

    count(filter) {
      const filtered = this.searchedTerritories && this.searchedTerritories.filter(
        t => get(t, 'status.status') === filter
      );
      return filtered && filtered.length || 0;
    },

    ...mapActions({
      resetTerritories: 'territories/resetTerritories',
      fetchPublishers: 'publishers/fetchPublishers',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
  },

  async mounted() {
    const congId = this.congId || (this.user && this.user.congId);
    this.setLeftNavRoute('/');
    await this.fetch();
    await this.fetchPublishers(congId);
  },
};
</script>

<style scoped lang="scss">
.availability-filter, .sort-btn {
  .selected {
    margin-left: -20px;
  }
}
.availability-filter, .sort-btn li {
  width: calc(100% - 1rem);
}
header {
  padding: 1.25rem 2rem;
}
.list-group {
  display: flex;
}
h4 {
  margin: 0;
  font-size: 18px;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.list-group-item {
  text-align: left;
  padding: 0.75rem 2rem;
  border-width: 2px;
}
.list-group-item:hover {
  cursor: pointer;
}
.list-group-item a {
  padding-top: 0.4rem;
}
.list-group-item h5 {
  font-weight: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recently-worked-button {
  background: transparent;
}
.list-group-item .checkout-publisher-dropdown>button.btn.btn-link {
  padding: 0 !important;
}

@media print {
  .columns {
    columns: 2;
  }
}
</style>
