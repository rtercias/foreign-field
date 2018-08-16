<template>
  <div id="app">
    <div>
      <b-navbar type="dark" variant="primary" toggleable>
        <b-navbar-toggle target="nav_dropdown_collapse"></b-navbar-toggle>
        <b-collapse is-nav id="nav_dropdown_collapse">
          <b-navbar-nav>
            <b-nav-item to="/">Home</b-nav-item>
            <!--TODO: move Territories dropdown into its own component -->
            <b-nav-item-dropdown v-if="checkPermission" class="group-codes" text="Territories">
              <b-dropdown-item v-for="group in groupCodes" v-bind:key="group" :to="`/territories/${group}`">
                <font-awesome-icon icon="check" v-if="group === groupCode" /> {{group}}
              </b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item v-if="!isAuthenticated" right @click="login">Login</b-nav-item>
            <b-nav-item-dropdown v-if="isAuthenticated" right>
              <span slot="text">{{name}}</span>
              <b-dropdown-item @click="logout">Logout</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import uniqBy from 'lodash/uniqBy';
import Home from './components/Home'
import Territories from './components/Territories';

export default {
  name: 'app',
  components: {
    Home,
    Territories,
  },
  watch: {
    '$route' (to) {
      if (to.params.group) {
        this.groupCode = to.params.group;
      }
    }
  },
  data() {
    return {
      name: '',
      groupCode: this.$route.params.group,
      groupCodes: [],
      permissions: {
        territories: ['Admin', 'TS']
      }
    };
  },
  methods: {
    login() {
      this.$store.dispatch('auth/login').then(async (profile) => {
        try {
          const username = profile.getEmail();
          await this.$store.dispatch('auth/authorize', username);
          
          const user = this.$store.state.auth.user;
          if (!user) {
            this.$store.dispatch('auth/forceout');
            throw new Error('User not found');
          }
          
          this.name = profile.getName();
          this.loadGroupCodes();

        } catch (exception) {
          this.$store.dispatch('auth/forceout');
          console.error('User is unauthorized');
        }
      });
    },

    logout() {
     this.$store.dispatch('auth/logout');
     this.$router.push('/');
    },

    async loadGroupCodes() {
      const response = await axios({
        url: process.env.VUE_APP_ROOT_API,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          query: `{ territories (congId: ${this.congId}) { group_code }}`
        }
      });

      const territories = response.data.data.territories;
      // const group = sessionStorage.getItem('group-code');
      // if (group) this.setGroupCode(group);

      this.groupCodes = uniqBy(territories, 'group_code').map(g => g.group_code).sort();
    },

    async setGroupCode(value) {
      if(value != this.groupCode) {
        this.groupCode = value;
      }
      // this.territories = await this.getTerritories();
      // sessionStorage.setItem('group-code', value);
    },
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isAuthorized: 'auth/isAuthorized',
      user: 'auth/user',
      congId: 'auth/congId'
    }),
    checkPermission() {
      return this.user && this.permissions.territories.includes(this.user.role);
    }
  },
}

</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #696969;
  margin-top: 60px;
  margin-right: 2px;
}
.dropdown-item {
  color: #696969;
}
.dropdown-item.active, .dropdown-item:active {
  padding-left: 0;
}
</style>
