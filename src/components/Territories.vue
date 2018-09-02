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
      <b-list-group-item v-for="terr in territories" v-bind:key="terr.id" data-toggle="collapse" class="territory-card col-md-6 pl-4 pr-4">
        <TerritoryCard v-bind="{terr, groupCode, selectTerritory, refreshTerritories}"></TerritoryCard>
      </b-list-group-item>
    </b-list-group>
    <CheckoutModal 
      v-bind:cong-id="congId" 
      v-bind:territory-id="selectedTerritory.id" 
      v-bind:territory="selectedTerritory"
      v-on:territory-checkedout="refreshTerritories">
    </CheckoutModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import TerritoryCard from './TerritoryCard.vue';
import CheckoutModal from './CheckoutModal.vue';
// import { mapActions } from 'vuex';

export default {
  name: 'Territories',
  components: {
    TerritoryCard,
    CheckoutModal,
  },
  async beforeRouteUpdate (to, from, next) {
    this.groupCode = to.params.group;
    this.territories = await this.getTerritories();
    next();
  },
  data() {
    return {
      groupCode: '',
      territories: [],
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
  methods: {
    selectTerritory(territory) {
      this.selectedTerritory = territory;
    },

    async getTerritories() {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `query TerritoriesByCongAndGroup($congId: Int $groupCode: String) { 
            territories (congId: $congId, group_code: $groupCode) { 
              id 
              name 
              type 
              city 
              status {
                status
                date
                publisher {
                  username
                  firstname
                  lastname
                }
              }
            }
          }`,
          variables: {
            congId: this.congId,
            groupCode: this.groupCode,
          }
        }
      });

      if (!response || !response.data || !response.data.data || !response.data.data.territories) {
        return null;
      }

      if (this.availability === 'All') {
        return response.data.data.territories;
      }

      return response.data.data.territories.filter(t => t.status.status === this.availability);
    },

    async setAvailability(value) {
      this.availability = value;
      this.territories = await this.getTerritories();
      sessionStorage.setItem('availability', value);
    },

    async refreshTerritories() {
      this.territories = await this.getTerritories();
    }
  },

  async mounted() {
    this.groupCode = this.$route.params.group;
    this.availability = sessionStorage.getItem('availability') || 'Available';
    await this.refreshTerritories();
  },

  computed: {
    ...mapGetters({
      congId: 'auth/congId',
      user: 'auth/user',
    }),
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
