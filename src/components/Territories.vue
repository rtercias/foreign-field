<template>
  <Loading v-if="loading"></Loading>
  <div v-else class="territories" :key="groupId">
    <header class="page-header sticky-top d-flex flex-column align-items-center py-3 px-2 border-bottom">
      <div class="d-flex w-100 justify-content-between">
        <div class="d-flex flex-column pl-0 pr-4" :class="{ 'col-4': !isDesktop }">
          <groups-select :selected-id="selectedGroup" :save="true" />
          <b-button-group v-if="isDesktop" class="p-sm-0 d-block mt-2">
            <b-badge
              variant="primary"
              class="btn alert p-2 border-medium mb-0"
              :class="{ 'border-info': typeFilter === 'REGULAR' }"
              @click="() => setTypeFilter('REGULAR')">
              Regular ({{count('Regular')}})
            </b-badge>
            <b-badge
              variant="warning"
              class="btn alert p-2 border-medium mb-0"
              :class="{ 'border-info': typeFilter === 'SEARCH' }"
              @click="() => setTypeFilter('SEARCH')">
              Survey ({{count('SEARCH')}})
            </b-badge>
            <b-badge
              variant="success"
              class="btn alert p-2 border-medium mb-0"
              :class="{ 'border-info': typeFilter === 'BUSINESS' }"
              @click="() => setTypeFilter('BUSINESS')">
              Business ({{count('Business')}})
            </b-badge>
          </b-button-group>
        </div>
        <div class="d-flex flex-column text-nowrap" :class="{ 'col-4 p-0': !isDesktop }">
          <div class="d-flex justify-content-end">
            <b-dropdown right :variant="typeFilter || availability? 'warning' : 'secondary'" class="pr-2 text-left">
              <span slot="button-content">
                <font-awesome-icon icon="filter" />
                <span v-if="isDesktop">
                  <span v-if="!typeText && !availabilityText(availability)" class="pl-1">Filter</span>
                  {{
                    `${typeText}
                    ${typeText && availabilityText(availability) ? ' - ' : ''}
                    ${availabilityText(availability)}`
                  }}
                </span>
              </span>
              <b-dropdown-item
                class="availability-filter p-0 d-block"
                v-for="type in typeFilters"
                v-bind:key="type.value"
                @click="() => setTypeFilter(type.value)">
                <font-awesome-icon class="selected" icon="check" v-if="typeFilter === type.value" />
                {{`${type.text} (${count(type.value)})`}}
              </b-dropdown-item>
              <b-dropdown-divider class="w-100 pr-4"></b-dropdown-divider>
              <b-dropdown-item
                class="availability-filter p-0 d-block"
                v-for="avail in availabilityFilters.filter(a => a.value !== DEFAULT_FILTER)"
                v-bind:key="avail.value"
                @click="() => setAvailability(avail.value)">
                <font-awesome-icon class="selected" icon="check" v-if="availability === avail.value" />
                {{availabilityText(avail.value)}}
                <font-awesome-icon icon="circle-notch" spin v-if="loadingStatuses" class="text-black-50" />
                <span v-else>({{count(avail.value)}})</span>
              </b-dropdown-item>
              <b-dropdown-divider class="w-100 pr-4"></b-dropdown-divider>
              <b-dropdown-item
                class="availability-filter p-0 d-block"
                v-for="countFilter in countFilters"
                v-bind:key="countFilter.value"
                @click="() => selectCountFilter(countFilter.value)">
                <font-awesome-icon class="selected" icon="check" v-if="selectedCountFilter === countFilter.value" />
                {{countFilter.text}}
              </b-dropdown-item>
            </b-dropdown>
            <div class="px-0 pt-0
              text-right d-md-block d-sm-flex justify-content-between">
              <b-dropdown class="sort-btn pr-2" right variant="secondary">
                <span slot="button-content">
                  <font-awesome-icon v-if="sortDirection === 'asc'" icon="sort-amount-up-alt" />
                  <font-awesome-icon v-else icon="sort-amount-down-alt" />
                  <span v-if="isDesktop" class="pl-1">{{sortOption}}</span>
                </span>
                <b-dropdown-item
                  v-for='option in sortOptions'
                  :key="option.value"
                  class="d-block"
                  @click="() => sort(option.value)">
                  <font-awesome-icon class="selected" icon="check" v-if="sortOption === option.value" />
                  <span :class="{ 'pl-1': sortOption === option.value }">{{option.text}}</span>
                </b-dropdown-item>
              </b-dropdown>
              <b-button v-if="canManage" variant="success" :to="`/territories/add?group=${selectedGroup}`">
                <font-awesome-icon icon="plus"></font-awesome-icon>
                <span v-if="isDesktop" class="pl-1">Territory</span>
              </b-button>
            </div>
          </div>
          <b-button-group v-if="isDesktop" class="text-right p-sm-0 d-block mt-2">
            <b-badge
              v-for="avail in availabilityFilters.filter(a => a.value !== DEFAULT_FILTER)"
              :key="avail.value"
              class="btn alert p-2 border-medium mb-0"
              :class="{
                'border-primary': availability === avail.value,
                'border-secondary bg-white': avail.value === 'Available' && availability !== 'Available',
                [`alert-${avail.variant}`]: avail.variant,
              }"
              @click="() => setAvailability(avail.value)">
              {{availabilityText(avail.value)}}
              <font-awesome-icon icon="circle-notch" spin v-if="loadingStatuses" />
              <span v-else>({{count(avail.value)}})</span>
            </b-badge>
          </b-button-group>
        </div>
      </div>
      <div class="d-flex align-self-start mt-2 small">
        Address Count (current view): {{addressCount}}
      </div>
      <SearchBar
        class="w-100 pt-1"
        :search-text="'Filter by territory name, description, id, tag, or publisher name'"
        :results="filteredTerritories"
        allow-exclude="true"
        :model="keywordFilter"
        no-padding="true"
        @on-change="applyFilter">
      </SearchBar>
    </header>
    <div>
      <b-list-group class="columns flex-row flex-wrap border-top">
        <b-list-group-item
          v-for="terr in filteredTerritories"
          v-bind:key="terr.id"
          data-toggle="collapse"
          class="territory-card col-md-6 col-lg-3 px-4"
          :class="{
            'list-group-item-success': get(terr, 'status.status') === 'Recently Worked',
            'list-group-item-warning': get(terr, 'status.status') === 'Checked Out'
          }">
          <TerritoryCard
            :terr="terr"
            :groupId="terr.group_id"
            :fetch="fetch"
            :type-filters="typeFilters"
            :isCheckingOut="isCheckingOut">
          </TerritoryCard>
        </b-list-group-item>
      </b-list-group>
    </div>
    <span class="d-block p-3" v-if="!loading && filteredTerritories && filteredTerritories.length === 0">
      There are no {{availability}} territories
      <span v-if="availability || typeFilter">matching the selected filters</span>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import TerritoryCard from './TerritoryCard.vue';
import GroupsSelect from './GroupsSelect';
import SearchBar from './SearchBar';
import Loading from './Loading.vue';
import orderBy from 'lodash/orderBy';
import toLower from 'lodash/toLower';
import { displayName } from '../utils/publisher';

const DEFAULT_FILTER = '';
const DEFAULT_SORT = 'Description';

export default {
  name: 'Territories',
  props: ['groupId'],
  components: {
    TerritoryCard,
    Loading,
    SearchBar,
    GroupsSelect,
  },
  beforeRouteLeave(to, from, next) {
    const token = get(this.territoriesCancelTokens, 'FETCH_TERRITORIES');
    if (token) token.cancel();
    next();
  },
  data() {
    return {
      selectedTerritory: {},
      selectedGroup: 0,
      keywordFilter: '',
      excludeKeyword: false,
      cities: [],
      availability: '',
      typeFilter: '',
      availabilityFilters: [
        { value: '', text: '', campaignText: '' },
        { value: 'Available', text: 'Available', campaignText: 'Remainder' },
        { value: 'Checked Out', text: 'Checked Out', campaignText: 'In Progress', variant: 'warning' },
        { value: 'Recently Worked', text: 'Recently Completed', campaignText: 'Done', variant: 'success' },
      ],
      typeFilters: [
        { value: 'SEARCH', text: 'Survey', variant: 'warning' },
        { value: 'BUSINESS', text: 'Business', variant: 'success' },
        { value: 'REGULAR', text: 'Regular', variant: 'light' },
        { value: 'Test', text: 'Test', variant: 'danger' },
      ],
      countFilters: [
        { value: 1, text: 'With Addresses' },
        { value: 2, text: 'Without Addresses' },
        { value: 3, text: 'With Phones' },
        { value: 4, text: 'Without Phones' },
      ],
      sortOption: DEFAULT_SORT,
      sortOptions: [
        { value: 'Name', text: 'Name' },
        { value: 'Description', text: 'Description' },
        { value: 'Completed Date', text: 'Completed Date' },
      ],
      sortDirection: 'asc',
      loading: true,
      DEFAULT_FILTER,
      selectedCountFilter: 0,
      isReassign: false,
    };
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      congregation: 'congregation/congregation',
      user: 'auth/user',
      publishers: 'publishers/publishers',
      token: 'auth/token',
      territories: 'territories/territories',
      groups: 'group/groups',
      group: 'group/group',
      isDesktop: 'auth/isDesktop',
      canManage: 'auth/canManage',
      territoriesCancelTokens: 'territories/cancelTokens',
      selectedSortAndFilters: 'territories/selectedSortAndFilters',
      isCheckingOut: 'territory/isCheckingOut',
      scrollYPosition: 'auth/scrollYPosition',
      loadingStatuses: 'territories/loadingStatuses',
    }),
    searchedTerritories() {
      if (this.keywordFilter) {
        return this.territories.filter(t => this.excludeKeyword !== this.compareToKeyword(
          this.keywordFilter,
          [
            t.name,
            t.description,
            t.tags,
            t.id,
            get(t.status, 'status') === 'Checked Out' && displayName(get(t.status, 'publisher')),
          ],
        ));
      }
      if (this.typeFilter) {
        return this.territories.filter(t => this.compareToKeyword(this.typeFilter, [t.type]));
      }
      return this.territories;
    },
    filteredTerritories() {
      if (this.availability === DEFAULT_FILTER) {
        let allTerrs = this.searchedTerritories;
        allTerrs = this.applyCountFilter(allTerrs);
        if (this.sortOption === 'Completed Date') {
          return orderBy(allTerrs,
            [terr => get(terr, 'status.date')],
            [this.sortDirection]);
        }
        return orderBy(allTerrs, toLower(this.sortOption), this.sortDirection);
      }
      let filtered = this.searchedTerritories && this.searchedTerritories.filter(
        t => get(t, 'status.status') === this.availability
      );
      filtered = this.applyCountFilter(filtered);
      if (this.sortOption === 'Completed Date') {
        return orderBy(filtered,
          [terr => get(terr, 'status.date')],
          [this.sortDirection]);
      }

      return orderBy(filtered, toLower(this.sortOption), this.sortDirection);
    },
    isCampaignMode() {
      return !!get(this.user, 'congregation.currentCampaign');
    },
    typeText() {
      return (this.typeFilters.find(t => t.value === this.typeFilter) || { text: '' }).text;
    },
    addressCount() {
      const reducer = (sum, count) => sum + (count || 0);
      const initialValue = 0;
      return this.filteredTerritories.map(t => t.addressCount).reduce(reducer, initialValue).toLocaleString();
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
    async setAvailability(value) {
      this.availability = this.availability === value ? DEFAULT_FILTER : value;
      this.setSortAndFilter({ availability: this.availability });
    },

    async setTypeFilter(value) {
      this.typeFilter = this.typeFilter === value ? '' : value;
      this.setSortAndFilter({ type: this.typeFilter });
    },

    sort(value) {
      this.sortOption = value;
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.setSortAndFilter({ sort: this.sortOption, sortDirection: this.sortDirection });
    },

    async fetch() {
      this.loading = true;
      const congId = this.congId || get(this.congregation, 'id') || (this.user && this.user.congId);
      if (congId && !this.groups.length) await this.getGroups({ congId });
      if (this.user && get(this.group, 'congregation_id')
        && get(this.user, 'congregation.id') !== get(this.group, 'congregation_id')) {
        this.$router.replace('/unauthorized');
        return;
      }
      if (!this.publishers.length) {
        await this.fetchPublishers(congId);
      }

      this.selectedGroup = this.groupId || 0;
      this.availability = this.selectedSortAndFilters.availability || DEFAULT_FILTER;
      this.typeFilter = this.selectedSortAndFilters.type || '';
      this.selectedCountFilter = this.selectedSortAndFilters.count || 0;
      this.sortOption = this.selectedSortAndFilters.sort
        || get(this.congregation, 'options.territories.defaultSort')
        || DEFAULT_SORT;
      this.sortDirection = this.selectedSortAndFilters.sortDirection
        || get(this.congregation, 'options.territories.defaultSortDirection')
        || 'asc';
      this.keywordFilter = this.selectedSortAndFilters.keyword || '';

      const doFetchTerritories = this.group.id !== this.selectedGroup || !this.territories.length;
      if (doFetchTerritories) {
        await this.fetchTerritories({
          congId,
          groupId: this.selectedGroup === 0 ? null : this.groupId,
        });

        this.setLoadingStatuses(true);
        this.fetchStatuses({
          congId,
          groupId: this.selectedGroup === 0 ? null : this.groupId,
        });
      }

      if (congId) {
        this.getAddressCountByTerritories(congId);
        this.getPhoneCountByTerritories(congId);
      }
      this.loading = false;
    },

    applyFilter(value, exclude) {
      this.keywordFilter = value;
      this.excludeKeyword = exclude;
      this.setSortAndFilter({ keyword: this.keywordFilter });
    },

    compareToKeyword(filter, values) {
      return values.reduce(
        (acc, value) => acc || toLower(String(value)).includes(toLower(filter)),
        false,
      );
    },

    count(filter) {
      if (!this.territories && !this.searchedTerritories) return 0;
      if (!filter) return this.searchedTerritories.length;
      if (this.typeFilters.map(t => toLower(t.value)).includes(toLower(filter))) {
        return this.territories.filter(t => toLower(t.type) === toLower(filter)).length;
      }
      if (this.availabilityFilters.map(t => t.value).includes(filter)) {
        return this.searchedTerritories.filter(t => get(t, 'status.status') === filter).length;
      }
      return 0;
    },

    availabilityText(availability) {
      const avail = this.availabilityFilters.find(t => t.value === availability);
      if (!avail) return DEFAULT_FILTER;
      if (this.isCampaignMode) {
        return avail.campaignText;
      }
      return avail.text;
    },

    selectCountFilter(value) {
      if (value === this.selectedCountFilter) {
        this.selectedCountFilter = 0;
      } else {
        this.selectedCountFilter = value;
      }
      this.setSortAndFilter({ count: this.selectedCountFilter });
    },

    ...mapActions({
      resetTerritories: 'territories/resetTerritories',
      fetchPublishers: 'publishers/fetchPublishers',
      fetchTerritories: 'territories/fetchTerritories',
      fetchStatuses: 'territories/fetchStatuses',
      getGroup: 'group/getGroup',
      getGroups: 'group/getGroups',
      getAddressCountByTerritories: 'territories/getAddressCountByTerritories',
      getPhoneCountByTerritories: 'territories/getPhoneCountByTerritories',
      setSortAndFilter: 'territories/setSortAndFilter',
      removeSortAndFilter: 'territories/removeSortAndFilter',
      setLoadingStatuses: 'territories/setLoadingStatuses',
    }),

    applyCountFilter(territories) {
      if (this.selectedCountFilter === 1) {
        return territories.filter(t => t.addressCount > 0);
      }
      if (this.selectedCountFilter === 2) {
        return territories.filter(t => !t.addressCount || t.addressCount === 0);
      }
      if (this.selectedCountFilter === 3) {
        return territories.filter(t => t.phoneCount > 0);
      }
      if (this.selectedCountFilter === 4) {
        return territories.filter(t => !t.phoneCount || t.phoneCount === 0);
      }

      return territories;
    },
  },

  async mounted() {
    const congId = get(this.congregation, 'id') || (this.user && this.user.congId);
    this.selectedGroup = this.groupId;
    if (get(this.group, 'congregation_id') !== congId) this.selectedGroup = 0;
    await this.fetch();
    window.scrollTo(0, this.scrollYPosition[this.$route.path] || 0);

    if (this.$route.query.territory) {
      this.applyFilter(this.$route.query.territory);
    }
  },
};
</script>

<style lang="scss">
.territories {
  .selected-group {
    .dropdown-toggle {
      width: 100%;
    }
    &.alert {
      .dropdown-toggle {
        font-size: small;
      }
    }
  }
  .availability-filter, .sort-btn {
    .selected {
      margin-left: -20px;
    }
  }
  .availability-filter, .sort-btn li {
    width: calc(100% - 1rem);
  }
  .page-header {
    padding: 1.25rem 2rem;

    .dropdown {
      max-height: 38px;
    }
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
    cursor: default !important;

    &:first-child {
      border-top: none;
    }
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
}
</style>
