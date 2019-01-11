<template>
  <div class="territories">
    <header class="w-100 m-0 row align-items-center justify-content-between">
      <h4 class="text-left">Service Group: {{groupCode}}</h4>
      <b-dropdown right variant="secondary">
        <span slot="button-content">{{availability}}</span>
        <b-dropdown-item v-for="avail in availabilityFilters" v-bind:key="avail" @click="setAvailability(avail)">
          <font-awesome-icon icon="check" v-if="availability === avail" /> {{avail}}
        </b-dropdown-item>
      </b-dropdown>
    </header>
    <b-list-group class="flex-row flex-wrap">
      <b-list-group-item v-for="terr in filteredTerritories" v-bind:key="terr.id" data-toggle="collapse" class="territory-card col-md-6 pl-4 pr-4">
        <TerritoryCard v-bind="{terr, groupCode, selectTerritory}"></TerritoryCard>
      </b-list-group-item>
    </b-list-group>
    <CheckoutModal 
      v-bind:cong-id="congId" 
      v-bind:territory="selectedTerritory">
    </CheckoutModal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import TerritoryCard from './TerritoryCard.vue';
import CheckoutModal from './CheckoutModal.vue';

export default {
  name: 'Territories',
  components: {
    TerritoryCard,
    CheckoutModal,
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
    };
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
      territories: 'territories/territories',
    }),

    filteredTerritories() {
      if (this.availability === 'All') {
        return this.territories;
      }

      return this.territories && this.territories.filter(t => t.status && t.status.status === this.availability);
    }
  },

  watch: {
    congId() {
      this.fetch();
    },
  },

  methods: {
    selectTerritory(territory) {
      this.selectedTerritory = territory;
    },

    async setAvailability(value) {
      console.log('setAvailability:value', value);
      this.availability = value;
      await this.fetchTerritories({ congId: this.congId, groupCode: this.groupCode });
      sessionStorage.setItem('availability', value);
    },

    async fetch() {
      const congId = this.congId || (this.user && this.user.congId);
      this.groupCode = this.$route.params.group;
      this.availability = sessionStorage.getItem('availability') || 'Available';
      await this.fetchTerritories({ congId, groupCode: this.groupCode });
    },

    ...mapActions({
      fetchTerritories: 'territories/fetchTerritories',
    }),
  },

  mounted() {
    this.fetch();
  }
}
</script>

<style scoped>
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
  background-color: #f8f9fa;
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
.dropdown-item.active, .dropdown-item:active {
  padding-left: 0;
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
