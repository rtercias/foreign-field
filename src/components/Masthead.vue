<template>
  <div class="masthead lead sticky-top">
    <vue-pull-refresh class="bg-primary" :on-refresh="onRefresh" :config="refreshOptions">
      <b-navbar
        class="border-warning"
        :class="{
          'gold-bottom': !isDesktop,
          'font-weight-bold text-left large-font-menu align-items-baseline': isDesktop
        }"
        type="dark"
        variant="primary"
        toggleable
        fill>
        <b-link class="button text-white-50" @click="back">
          <font-awesome-icon icon="chevron-left" v-show="showLeftNav && !isDesktop"></font-awesome-icon>
        </b-link>
        <b-nav-text v-if="!isDesktop && isCampaignMode && isSearchHidden">CAMPAIGN MODE</b-nav-text>
        <b-nav-text id="nav-search-bar" class="py-1" :class="{ 'pl-4': !isDesktop, 'w-100': isDesktop }">
          <search-bar
            v-if="!isSearchHidden || isDesktop"
            class="search-bar w-100"
            :search-text="'Search address or territory'"
            @on-click="search"
            :no-padding="true"
          />
          <font-awesome-icon
            v-if="isSearchHidden && !isDesktop"
            icon="search"
            class="text-white-50"
            @click="isSearchHidden = false"
          />
        </b-nav-text>
        <b-navbar-toggle :class="{ 'd-none': isDesktop }" target="nav_dropdown_collapse"></b-navbar-toggle>
        <b-collapse is-nav id="nav_dropdown_collapse" :class="{ 'show d-block': isDesktop }">
          <b-navbar-nav class="pt-3">
            <b-nav-item to="/">Home</b-nav-item>
            <b-nav-item v-if="canWrite" :to="`/groups/${groupCode}`">Territories</b-nav-item>
            <b-nav-item
              v-if="canWrite && matchingRouteNames.includes('territory')"
              :to="`/territories/${territory && territory.id}/optimize`">
              Optimize
            </b-nav-item>
            <b-nav-item
              v-if="canLead">
              <span :class="{ 'text-warning': isCampaignMode }" @click="toggleCampaignMode">
                <font-awesome-icon v-if="togglingCampaignMode" icon="circle-notch" spin />
                <font-awesome-icon v-else :icon="isCampaignMode ? 'ban' : 'bolt'" />
                {{isCampaignMode ? 'End Campaign' : 'New Campaign'}}
              </span>
              <font-awesome-icon v-if="canLead" class="ml-1 text-info" icon="info-circle" @click="toggleCampaignHelp" />
              <b-toaster name="campaign-help"></b-toaster>
            </b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown v-if="isAuthenticated" right>
              <span slot="text">{{name}}</span>
              <b-dropdown-item class="m-0 w-100 text-center" @click="logout">Logout</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </vue-pull-refresh>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import VuePullRefresh from 'vue-pull-refresh';
import get from 'lodash/get';
import { channel } from '../main';
import SearchBar from './SearchBar';

export default {
  name: 'Masthead',
  components: {
    VuePullRefresh,
    SearchBar,
  },
  data() {
    return {
      permissions: {
        territories: ['Admin', 'TS', 'GO', 'SO'],
      },
      refreshOptions: {
        errorLabel: 'Unable to reload',
        startLabel: 'Starting reload',
        readyLabel: 'Ready',
        loadingLabel: 'Reloading',
      },
      togglingCampaignMode: false,
      isSearchHidden: true,
    };
  },
  mounted() {
    channel.bind('check-in-all', async (congId) => {
      if (this.congId === congId) {
        this.$bvToast.toast('All territories have been checked in.', {
          variant: 'success',
          noAutoHide: true,
        });
      }
    });
    channel.bind('copy-checkouts', async (congId) => {
      if (this.congId === congId) {
        this.$bvToast.toast('Territory checkouts have been preserved.', {
          variant: 'success',
          noAutoHide: true,
        });
      }
    });
  },
  methods: {
    ...mapActions({
      updateCongregation: 'auth/updateCongregation',
      checkinAll: 'territories/checkinAll',
      copyCheckouts: 'territories/copyCheckouts',
    }),
    logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/signout');
    },
    async onRefresh() {
      this.$router.go();
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    },
    back() {
      if (this.leftNavRoute) {
        this.$router.push(this.leftNavRoute);
      } else {
        this.$router.go(-1);
      }
    },
    search(keyword) {
      this.isSearchHidden = true;
      if (keyword) this.$router.push({ name: 'search', params: { keyword } });
    },
    async toggleCampaignMode() {
      if (this.isCampaignMode) {
        this.endCampaign();
      } else {
        this.startCampaign();
      }
    },
    async startCampaign() {
      const cong = { ...this.user.congregation };
      const message = 'Start a new campaign?';
      const response = await this.$bvModal.msgBoxConfirm(message, {
        title: `${cong.name} Campaign`,
        centered: true,
      });

      if (!response) return;
      this.togglingCampaignMode = true;

      // Step 1: toggle campaign mode
      cong.campaign = !cong.campaign;
      await this.updateCongregation({ cong });

      const checkinAll = await this.$bvModal.msgBoxConfirm(
        'Do you want to check in ALL territories, or allow publishers to keep their checked out territories', {
          title: `${cong.name} Campaign`,
          centered: true,
          okTitle: 'Check In',
          cancelTitle: 'Keep Checkouts',
        }
      );

      if (checkinAll) {
        // Step 2a: check in all
        this.$bvToast.toast('Checking in all territories. The page will refresh when it\'s done.', {
          variant: 'warning',
          noAutoHide: true,
        });

        await this.checkinAll({
          congId: cong.id,
          username: this.user.username,
          tzOffset: new Date().getTimezoneOffset().toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          campaign: false,
        });
      } else {
        // Step 2b: copy existing checkouts for campaign
        this.$bvToast.toast('Copying existing checkouts. The page will refresh when it\'s done.', {
          variant: 'warning',
          noAutoHide: true,
        });

        await this.copyCheckouts({
          congId: cong.id,
          username: this.user.username,
          campaign: true,
        });
      }

      this.togglingCampaignMode = false;
      this.$router.go();
    },
    async endCampaign() {
      const cong = { ...this.user.congregation };
      const message = 'End the current campaign?';
      const response = await this.$bvModal.msgBoxConfirm(message, {
        title: 'Campaign',
        centered: true,
      });

      if (!response) return;
      this.togglingCampaignMode = true;

      this.$bvToast.toast('Checking in all territories. The page will refresh when it\'s done.', {
        variant: 'warning',
        noAutoHide: true,
      });

      // Step 1: toggle campaign mode
      cong.campaign = !cong.campaign;
      await this.updateCongregation({ cong });

      // Step 2: check in all
      await this.checkinAll({
        congId: cong.id,
        username: this.user.username,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        campaign: true,
      });

      this.togglingCampaignMode = false;
      this.$router.go();
    },
    toggleCampaignHelp() {
      this.$bvToast.hide('campaign-help');

      const h = this.$createElement;
      const campaignHelp = h(
        'div', {
          domProps: {
            innerHTML:
            `<p><b>IMPORTANT: CAMPAIGNS WILL RESET ALL ACTIVITIES! PLEASE USE RESPONSIBLY.</b></p>
            <p>Campaigns allow territories to be worked separately from regular territory coverage.
            When a new campaign is started, you are given the option to <u>check in all territories</u> or
            allow publishers to <u>keep territories</u> they've already checked out.</p>
            <p>To begin, press "New Campaign".</p>
            <p>After the campaign, press "End Campaign".<br/>This will <u>check in all campaign territories</u>
            and reset them back to regular territories.</p>
            <p>It's also highly recommended to communicate to the publishers when Campaign Mode will start and end.</p>`,
          },
        },
      );

      this.$bvToast.toast([campaignHelp], {
        id: 'campaign-help',
        variant: 'warning',
        noAutoHide: true,
        toaster: this.isDesktop ? 'campaign-help' : undefined,
      });
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
      leftNavRoute: 'auth/mastheadLeftNavRoute',
      canManage: 'auth/canManage',
      canWrite: 'auth/canWrite',
      canRead: 'auth/canRead',
      canLead: 'auth/canLead',
      isDesktop: 'auth/isDesktop',
      territory: 'territory/territory',
    }),
    showLeftNav() {
      return this.$route.name !== 'home';
    },
    matchingRouteNames() {
      return this.$route.matched.map(r => r.name);
    },
    isCampaignMode() {
      return get(this.user, 'congregation.campaign') || false;
    },
    groupCode() {
      return get(this.territory, 'group_code') || (this.groupCodes && this.groupCodes.length && this.groupCodes[0]) || 'ALL';
    },
  },
};
</script>

<style lang="scss" scoped>
.masthead .navbar {
  min-height: 68px;
}
.pull-down-header {
  background-color: unset;
}
.gold-bottom {
  border-bottom: solid 6px;
}
.large-font-menu {
  font-size: 24px;
}
.dropdown-item {
  width: 100%;
}
.search-bar input {
  background: aliceblue;
}
</style>
