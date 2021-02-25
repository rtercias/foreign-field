<template>
  <div class="masthead lead sticky-top">
    <vue-pull-refresh class="bg-primary" :on-refresh="onRefresh" :config="refreshOptions">
      <b-navbar
        class="border-warning py-0"
        :class="{
          'gold-bottom': !isDesktop,
          'font-weight-bold text-left large-font-menu align-items-baseline': isDesktop
        }"
        type="dark"
        variant="primary"
        toggleable
        fill>
        <b-link class="button text-white-50" @click="goBack" v-show="showLeftNav && !isDesktop">
          <font-awesome-icon icon="chevron-left"></font-awesome-icon>
        </b-link>
        <b-nav-text class="campaign-mode" v-if="isSearchHidden">
          <span v-if="!isDesktop && isCampaignMode">CAMPAIGN MODE</span>
        </b-nav-text>
        <b-nav-text id="nav-search-bar" class="py-1" :class="{
          'w-full ml-3': !isSearchHidden,
          'ml-5': isSearchHidden && !isDesktop,
          'w-100': isDesktop
          }">
          <search-bar
            v-if="(!isSearchHidden || isDesktop) && isAuthorized"
            class="search-bar w-100"
            :search-text="'Search address, phone or territory'"
            @on-click="search"
            :no-padding="true"
          />
          <font-awesome-icon
            v-if="(isSearchHidden && !isDesktop) && isAuthorized"
            icon="search"
            class="text-white-50 mt-2"
            @click="isSearchHidden = false"
          />
        </b-nav-text>
        <b-navbar-toggle :class="{ 'd-none': isDesktop }" target="nav_dropdown_collapse" @click="toggleClick" />
        <b-collapse is-nav id="nav_dropdown_collapse" :class="{ 'show d-block': isDesktop }">
          <b-navbar-nav class="pt-3">
            <b-nav-item to="/">Home</b-nav-item>
            <b-nav-item
              v-if="canWrite"
              :to="{ name: 'congregation-edit', params: { congregationId: congregation.id } }">
              {{congregation.name}}
            </b-nav-item>
            <b-nav-item v-if="canWrite" :to="`/groups/${groupId}`">Territories</b-nav-item>
            <b-nav-item
              v-if="canWrite && matchingRouteNames.includes('territory')"
              :to="`/territories/${territory && territory.id}/optimize`">
              Optimize
            </b-nav-item>
            <b-nav-item>
              <span :class="{ 'text-warning': isCampaignMode }" @click="toggleCampaignMode">
                <font-awesome-icon v-if="togglingCampaignMode" icon="circle-notch" spin />
                <font-awesome-icon v-else :icon="isCampaignMode ? 'ban' : 'bolt'" />
                {{isCampaignMode ? 'End Campaign' : 'New Campaign'}}
              </span>
              <font-awesome-icon class="ml-1 text-info" icon="info-circle" @click="toggleCampaignHelp" />
              <b-toaster name="campaign-help"></b-toaster>
            </b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown v-if="isAuthenticated" right>
              <span slot="text">{{name}}</span>
              <b-dropdown-item
                class="m-0 w-100"
                :to="{
                  name: 'publisher-edit',
                  params: { publisherId: get(user, 'id') },
                }">
                Profile
              </b-dropdown-item>
              <b-dropdown-item class="m-0 w-100" @click="logout">Logout</b-dropdown-item>
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
      checkinAll: 'territories/checkinAll',
      copyCheckouts: 'territories/copyCheckouts',
      back: 'auth/back',
      updateCongregation: 'congregation/updateCongregation',
    }),
    get,
    goBack() {
      this.back({ vm: this });
    },
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
    search(keyword) {
      const scrubbed = keyword.replace(/\W/g, '');
      this.isSearchHidden = true;
      if (scrubbed) this.$router.push({ name: 'search', params: { keyword: scrubbed } });
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
      await this.updateCongregation(cong);

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
            When a new campaign is started, all territories will be checked in.</p>
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
    toggleClick() {
      window.scrollTo({ top: 0 });
    },
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isAuthorized: 'auth/isAuthorized',
      user: 'auth/user',
      name: 'auth/name',
      congId: 'auth/congId',
      groups: 'group/groups',
      canManage: 'auth/canManage',
      canWrite: 'auth/canWrite',
      canRead: 'auth/canRead',
      canLead: 'auth/canLead',
      isDesktop: 'auth/isDesktop',
      territory: 'territory/territory',
      congregation: 'auth/congregation',
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
    groupId() {
      return get(this.territory, 'group_id') || get(this.groups, '[0].id') || 0;
    },
  },
};
</script>

<style lang="scss">
.masthead {
  .navbar {
    min-height: 52px;
  }
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
.campaign-mode {
  width: 172px;
}
#nav-search-bar {
  &.w-full {
    width: 260px;
  }

  .search-bar {
    input {
      background: aliceblue;
    }
    .search-btn {
      top: 0;
    }
  }
}
</style>
