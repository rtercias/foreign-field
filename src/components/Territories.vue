<template>
  <div class="territories">
    <header class="row align-items-center justify-content-between">
      <h4>Service Group: {{groupCode}}</h4>
      <b-dropdown right variant="secondary">
        <span slot="button-content">{{availability}}</span>
        <b-dropdown-item v-for="avail in availabilityFilters" v-bind:key="avail" @click="setAvailability(avail)">
          <font-awesome-icon icon="check" v-if="availability === avail" /> {{avail}}
        </b-dropdown-item>
      </b-dropdown>
    </header>
    <b-list-group class="flex-row flex-wrap">
      <b-list-group-item v-for="terr in territories" v-bind:key="terr.id" data-toggle="collapse" class="territory-card col-md-6">
        <div class="row justify-content-between">
          <b-link :to="`/territories/${groupCode}/${terr.id}`">
            <h5>{{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span></h5>
          </b-link>
          <div class="btn-group" role="group" aria-label="Territory buttons">
            <b-button class="recently-worked-button" variant="disabled" v-if="terr.status === 'Recently Worked'" v-b-tooltip.hover title="Recently Worked">
              <font-awesome-icon icon="ban" />
            </b-button>
            <b-button variant="info" v-if="terr.status==='Available'" @click="checkoutTerritory(terr)">check out</b-button>
            <b-button variant="outline-info" v-if="terr.status==='Checked Out'" @click="checkinTerritory(terr)">check in</b-button>
          </div>
        </div>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios';
// import { mapActions } from 'vuex';

export default {
  name: 'Territories',
  async beforeRouteUpdate (to, from, next) {
    this.groupCode = to.params.group;
    this.territories = await this.getTerritories();
    next();
  },
  data() {
    return {
      congId: 1,
      publisherId: 43,
      groupCode: '',
      territories: [],
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
    async getTerritories() {
      const response = await axios({
        url: 'http://api.foreignfield.com/graphql',
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
              status 
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

      return response.data.data.territories.filter(t => t.status === this.availability);
    },

    async setAvailability(value) {
      this.availability = value;
      this.territories = await this.getTerritories();
      sessionStorage.setItem('availability', value);
    },

    async checkoutTerritory(territory) {
      await axios({
        url: 'http://api.foreignfield.com/graphql',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
            checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
              status 
            }
          }`,
          variables: {
            terrId: territory.id,
            pubId: this.publisherId,
            user: territory.proxyUser
          }
        }
      });
      
      territory.status = 'Checked Out';
    },

    async checkinTerritory(territory) {
      await axios({
        url: 'http://api.foreignfield.com/graphql',
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
            checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
              status 
            }
          }`,
          variables: {
            terrId: territory.id,
            pubId: this.publisherId,
            user: territory.proxyUser
          }
        }
      });

      territory.status = 'Recently Worked';
    }
  },

  async mounted() {
    this.groupCode = this.$route.params.group;
    this.availability = sessionStorage.getItem('availability') || 'Available';
    this.territories = await this.getTerritories();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
header {
  padding: 1.25rem 2rem;
}
.list-group {
  display: flex;
}
h4 {
  margin: 0;
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
}
.recently-worked-button {
  background: transparent;
}
.dropdown-item.active, .dropdown-item:active {
  padding-left: 0;
}

@media print {
  .columns {
    columns: 2;
  }
}
</style>
