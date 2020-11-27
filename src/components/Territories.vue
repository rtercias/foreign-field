<template>
  <Loading v-if="loading"></Loading>
  <div v-else class="territories" :key="groupCode">
    <header class="d-flex flex-column align-items-center px-3 pt-0">
      <div class="row w-100">
        <b-dropdown
          class="selected-group col-sm-12 col-md-3 text-left h-100 alert p-sm-0 px-0 mb-0"
          :text="`Service Group: ${selectedGroup}`">
          <b-dropdown-item
            v-for="group in groupCodes"
            :key="group"
            :to="{ name: 'group', params: { groupCode: group } }"
            class="w-100 mx-0 pl-2">
            <font-awesome-icon class="ml-n4" icon="check" v-if="group === selectedGroup" /> {{group}}
          </b-dropdown-item>
        </b-dropdown>
        <div class="col-sm-auto col-md-1"></div>
        <b-button-group v-if="isDesktop" class="col-sm-12 col-md-3 p-sm-0 d-block">
          <b-badge
            variant="warning"
            class="btn alert p-2 border-medium"
            :class="{ 'border-primary': typeFilter === 'SEARCH' }"
            @click="() => setTypeFilter('SEARCH')">
            Survey ({{count('SEARCH')}})
          </b-badge>
          <b-badge
            variant="success"
            class="btn alert p-2 border-medium"
            :class="{ 'border-primary': typeFilter === 'BUSINESS' }"
            @click="() => setTypeFilter('BUSINESS')">
            Business ({{count('Business')}})
          </b-badge>
        </b-button-group>
        <div class="col-sm-auto col-md-1"></div>
        <b-button-group v-if="isDesktop && isCampaignMode" class="col-sm-12 col-md-4 text-right p-sm-0 d-block">
          <b-badge
            v-for="avail in availabilityFilters.filter(a => a.value !== 'All')"
            :key="avail.value"
            class="btn alert p-2 border-medium"
            :class="{
              'border-primary': availability === avail.value,
              'border-secondary bg-white': avail.value === 'Available' && availability !== 'Available',
              [`alert-${avail.variant}`]: avail.variant,
            }"
            @click="() => setAvailability(avail.value)">
            {{availabilityText(avail.value)}} ({{count(avail.value)}})
          </b-badge>
        </b-button-group>
      </div>
      <SearchBar
        class="w-100"
        :search-text="'Filter by territory name or description'"
        :results="filteredTerritories"
        allow-exclude="true"
        @on-change="applyFilter">
      </SearchBar>
      <div class="d-flex w-100 justify-content-between w-100">
        <b-dropdown left variant="secondary">
          <span slot="button-content">
            <font-awesome-icon icon="filter" />
            {{`${typeText ? `${typeText} - ` : ''}${availability}`}}
          </span>
          <b-dropdown-item
            class="availability-filter p-0"
            v-for="type in typeFilters"
            v-bind:key="type.value"
            @click="() => setTypeFilter(type.value)">
            <font-awesome-icon class="selected" icon="check" v-if="typeFilter === type.value" />
            {{type.text}}
          </b-dropdown-item>
          <b-dropdown-divider class="w-100 pr-4"></b-dropdown-divider>
          <b-dropdown-item
            class="availability-filter p-0"
            v-for="avail in availabilityFilters"
            v-bind:key="avail.value"
            @click="() => setAvailability(avail.value)">
            <font-awesome-icon class="selected" icon="check" v-if="availability === avail" />
            {{isCampaignMode ? avail.campaignText : avail.value}}
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
    <div>
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
          <TerritoryCard
            :terr="terr"
            :groupCode="terr.group"
            :selectTerritory="selectTerritory"
            :fetch="fetch"
            :type-filters="typeFilters">
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
      typeFilter: '',
      availabilityFilters: [
        { value: 'All', campaignText: 'All' },
        { value: 'Available', campaignText: 'Remainder' },
        { value: 'Checked Out', campaignText: 'In Progress', variant: 'warning' },
        { value: 'Recently Worked', campaignText: 'Done', variant: 'success' },
      ],
      typeFilters: [
        { value: 'SEARCH', text: 'Survey', variant: 'warning' },
        { value: 'BUSINESS', text: 'Business', variant: 'success' },
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
      isDesktop: 'auth/isDesktop',
    }),
    searchedTerritories() {
      const { territories = [] } = this;
      if (this.keywordFilter) {
        return territories.filter(t => this.excludeKeyword !== this.compareToKeyword(
          this.keywordFilter,
          [t.name, t.description],
        ));
      }
      if (this.typeFilter) {
        return territories.filter(t => this.compareToKeyword(this.typeFilter, [t.type]));
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
    typeText() {
      return (this.typeFilters.find(t => t.value === this.typeFilter) || { text: '' }).text;
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
      this.availability = this.availability === value ? 'All' : value;
      sessionStorage.setItem('availability', this.availability);
    },

    async setTypeFilter(value) {
      this.typeFilter = this.typeFilter === value ? '' : value;
    },

    sort(value) {
      this.sortOption = value;
    },

    async fetch() {
      const congId = this.congId || (this.user && this.user.congId);
      this.selectedGroup = this.groupCode;
      this.availability = sessionStorage.getItem('availability') || DEFAULT_FILTER;
      await this.fetchTerritories({
        congId,
        groupCode: this.selectedGroup === 'ALL' ? '' : this.selectedGroup,
      });
      this.loading = false;
    },

    applyFilter(value, exclude) {
      this.keywordFilter = value;
      this.excludeKeyword = exclude;
    },

    compareToKeyword(filter, values) {
      return values.reduce(
        (acc, value) => acc || String(value).toLowerCase().includes(filter.toLowerCase()),
        false,
      );
    },

    count(filter) {
      if (!this.territories && !this.searchedTerritories) return 0;
      if (!filter) return this.searchedTerritories.length;
      if (this.typeFilters.map(t => t.value.toLowerCase()).includes(filter.toLowerCase())) {
        return this.territories.filter(t => t.type.toLowerCase() === filter.toLowerCase()).length;
      }
      if (this.availabilityFilters.map(t => t.value).includes(filter)) {
        return this.searchedTerritories.filter(t => get(t, 'status.status') === filter).length;
      }
      return 0;
    },

    availabilityText(availability) {
      if (this.isCampaignMode) {
        return (this.availabilityFilters.find(t => t.value === availability) || { campaignText: '' }).campaignText;
      }
      return availability;
    },

    ...mapActions({
      resetTerritories: 'territories/resetTerritories',
      fetchPublishers: 'publishers/fetchPublishers',
      setLeftNavRoute: 'auth/setLeftNavRoute',
      fetchTerritories: 'territories/fetchTerritories',
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

<style lang="scss">
.territories {
  .selected-group {
    .dropdown-toggle {
      width: 100%;
      font-size: small;
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
    cursor: default !important;
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
