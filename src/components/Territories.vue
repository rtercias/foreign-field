<template>
  <div class="territories">
    <header class="d-flex flex-column align-items-center">
      <div class="d-flex align-items-center justify-content-between w-100 pb-3">
        <h4 class="text-left pr-3">Service Group: {{groupCode}}</h4>
        <div v-if="isCampaignMode">
          <span class="small pr-1">Campaign Status:</span>
          <b-badge class="bg-white p-2 border-medium border-secondary">Remainder</b-badge>
          <b-badge class="alert-warning p-2 border-medium">In progress</b-badge>
          <b-badge class="alert-success p-2 border-medium">Completed</b-badge>
        </div>
      </div>
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
            'list-group-item-success': isCampaignMode && terr.status.status === 'Recently Worked',
            'list-group-item-warning': isCampaignMode && terr.status.status === 'Checked Out'
          }">
          <TerritoryCard :terr="terr" :groupCode="groupCode" :selectTerritory="selectTerritory" :fetch="fetch">
          </TerritoryCard>
        </b-list-group-item>
      </b-list-group>
      <CheckoutModal :territory="selectedTerritory" :fetch="fetch"></CheckoutModal>
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
import Loading from './Loading.vue';
import orderBy from 'lodash/orderBy';

export default {
  name: 'Territories',
  components: {
    TerritoryCard,
    CheckoutModal,
    Loading,
  },

  beforeRouteUpdate(to, from, next) {
    next();
    this.groupCode = to.params.group;
    this.fetch();
  },

  data() {
    return {
      groupCode: '',
      selectedTerritory: {},
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
    }),

    filteredTerritories() {
      if (this.availability === 'All') {
        const allTerrs = this.territories;
        return orderBy(allTerrs, this.sortOption.toLowerCase());
      }
      const filtered = this.territories && this.territories.filter(t => t.status && t.status.status === this.availability);
      return orderBy(filtered, this.sortOption.toLowerCase());
    },
    isCampaignMode() {
      return get(this.user, 'congregation.campaign') || false;
    },
  },

  watch: {
    congId() {
      if (!this.congId) return;
      this.fetch();
    },
  },

  methods: {
    selectTerritory(territory) {
      this.selectedTerritory = territory;
    },

    async setAvailability(value) {
      this.availability = value;
      await this.$store.dispatch('territories/fetchTerritories', {
        congId: this.congId,
        groupCode: this.groupCode,
      });
      sessionStorage.setItem('availability', value);
    },

    sort(value) {
      this.sortOption = value;
    },

    async fetch() {
      this.loading = true;
      const congId = this.congId || (this.user && this.user.congId);
      this.groupCode = this.$route.params.group;
      this.availability = sessionStorage.getItem('availability') || 'Available';
      await this.$store.dispatch('territories/fetchTerritories', {
        congId,
        groupCode: this.groupCode,
      });
      await this.fetchPublishers(congId);
      this.loading = false;
    },

    ...mapActions({
      resetTerritories: 'territories/resetTerritories',
      fetchPublishers: 'publishers/fetchPublishers',
      setLeftNavRoute: 'auth/setLeftNavRoute',
    }),
  },

  mounted() {
    this.setLeftNavRoute('/');
    this.fetch();
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
