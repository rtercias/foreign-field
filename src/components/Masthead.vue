<template>
  <div class="lead">
    <b-navbar type="dark" variant="primary" toggleable fill>
      <b-navbar-toggle target="nav_dropdown_collapse"></b-navbar-toggle>
      <b-collapse is-nav id="nav_dropdown_collapse">
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item-dropdown v-if="checkPermission" class="group-codes" text="Territories">
            <b-dropdown-item v-for="group in groupCodes" v-bind:key="group" :to="`/territories/${group}`">
              <font-awesome-icon icon="check" v-if="group === groupCode" /> {{group}}
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <!-- <b-nav-item-dropdown
            v-if="checkPermission && $router.currentRoute.name==='territory'"
            class="group-codes" text="Territory">
            <b-dropdown-item @click="shareWorkInProgress">Share
            </b-dropdown-item>
          </b-nav-item-dropdown> -->
          <b-nav-item v-if="canViewDNC" :to="`/dnc/${this.user.congregation.id}`">DNC</b-nav-item>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown v-if="isAuthenticated" right>
            <span slot="text">{{name}}</span>
            <b-dropdown-item @click="logout">Logout</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  watch: {
    $route(to) {
      if (to.params.group) {
        this.groupCode = to.params.group;
      }
    },
  },
  data() {
    return {
      groupCode: this.$route.params.group,
      permissions: {
        territories: ['Admin', 'TS', 'GO', 'SO'],
      },
    };
  },
  methods: {
    logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/signout');
    },

    shareWorkInProgress(addresses) {
      if (!addresses) {
        return;
      }

      const workInProgress = {};

      // get data from local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.includes('foreignfield-')) {
          // we're only interested in addresses in the current territory
          const addressId = key.split('-')[1];
          const isInTerritory = addresses.find(a => a.id === addressId);

          if (isInTerritory) {
            const item = localStorage.getItem(key);
            const val = item.split('-')[0];

            // save the address and current progress
            workInProgress[addressId] = val;
          }
        }
      }
    },
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isAuthorized: 'auth/isAuthorized',
      user: 'auth/user',
      name: 'auth/name',
      congId: 'auth/congId',
      terrCongId: 'territory/congId',
      groupCodes: 'auth/groupCodes',
    }),
    checkPermission() {
      return this.user && this.permissions.territories.includes(this.user.role);
    },
    canViewDNC() {
      return this.user && ['Admin', 'TS', 'GO', 'SO', 'RP', 'PUB'].includes(this.user.role);
    },
  },
};
</script>

<style>
.dropdown-item {
  color: #696969;
}
.dropdown-item.active, .dropdown-item:active {
  padding-left: 0;
}
</style>
