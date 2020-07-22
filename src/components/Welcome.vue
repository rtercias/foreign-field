<template>
  <b-container class="dashboard lead">
    <h3 v-if="!isAuthenticated">Welcome to Foreign Field</h3>
    <Auth v-if="!isAuthenticated"></Auth>
    <b-row v-else class="main">
      <div class="col-sm-12">
        <h3><img :src="require('../assets/icon-x.png')" class="logo" /><span>Dashboard</span></h3>
        <hr />
        <Loading v-if="loading"></Loading>
      </div>
      <div v-if="!loading" class="col-sm-12 col-md-6">
        <span v-if="!(territories && territories.length)">I have no territories checked out.</span>
        <div v-else>
          <span>Territories I've checked out:</span>
          <ul class="d-flex flex-column">
            <li class="pt-3 m-0 font-weight-bold" v-for="terr in territories" :key="terr.id">
              <MyTerritory :territory="terr"></MyTerritory>
            </li>
          </ul>
          <div v-if="seenTerritories.length">
            <hr />
            <span>Other territories I've recently seen:</span>
            <ul class="d-flex flex-column">
              <li class="pt-3 m-0 font-weight-bold" v-for="terr in seenTerritories" :key="terr.id">
                <MyTerritory :territory="terr"></MyTerritory>
              </li>
            </ul>
          </div>
        </div>
        <hr />
      </div>
      <div v-if="!loading" class="col-sm-12 col-md-6 p-3 pt-5">
        <Reports v-if="canWrite" />
      </div>
    </b-row>
    <div class="icon-attribution">
      Icons made by
      <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a>
      from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
    </div>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex';
import Auth from './Auth';
import Loading from './Loading.vue';
import Reports from './Reports';
import MyTerritory from './MyTerritory';

export default {
  name: 'Welcome',
  components: {
    Auth,
    Loading,
    Reports,
    MyTerritory,
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      loading: 'auth/loading',
      canWrite: 'auth/canWrite',
    }),
    territories() {
      return this.user && this.user.territories;
    },
    seenTerritories() {
      let seenTerritories = [];
      if (localStorage.getItem('seenTerritories')) {
        try {
          seenTerritories = JSON.parse(localStorage.getItem('seenTerritories'));
        } catch (e) {
          localStorage.removeItem('seenTerritories');
        }
      }
      return seenTerritories.filter(s => !(this.territories && this.territories.some(t => t.id === s.id)));
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
.logo {
  width: 100px;
  margin-left: -30px;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
router-link {
  cursor: pointer;
}
.main {
  display: flex;
}
.icon-attribution {
  font-size: 12px;
  position: fixed;
  bottom: 0;
  right: 0;
  padding-bottom: 30px;
  padding-right: 15px;
}
</style>
