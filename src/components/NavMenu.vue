<template>
  <b-navbar-nav
    class="pt-3 flex-column large-font-menu font-weight-bold"
    :class="{ 'text-left': isDesktop }">
    <b-nav-item to="/">Home</b-nav-item>
    <b-nav-item
      v-if="canWrite"
      :to="{ name: 'congregation-edit', params: { congregationId: congregation.id } }">
      {{congregation.name}}
    </b-nav-item>
    <b-nav-item v-if="canSwitchCong" :to="{ name: 'congregation-switch' }">Switch Cong</b-nav-item>
    <b-nav-item v-if="canWrite" :to="`/groups/${groupId}`">Territories</b-nav-item>
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
      <font-awesome-icon class="ml-1 text-info" icon="info-circle" @click="toggleCampaignHelp" />
      <b-toaster name="campaign-help"></b-toaster>
    </b-nav-item>
    <b-nav-item-dropdown v-if="isAuthenticated" right>
      <span slot="text">{{name}}</span>
      <b-dropdown-item
        class="m-0 w-100"
        :to="{
          name: 'publisher-edit',
          params: { publisherId: get(user, 'id', 0) },
        }">
        Profile
      </b-dropdown-item>
      <b-dropdown-item class="m-0 w-100" @click="logoutUser">Logout</b-dropdown-item>
    </b-nav-item-dropdown>
  </b-navbar-nav>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';

export default {
  name: 'NavMenu',
  data() {
    return {
      togglingCampaignMode: false,
    };
  },
  async mounted() {
    await this.getGroupsList();
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isDesktop: 'auth/isDesktop',
      user: 'auth/user',
      name: 'auth/name',
      canWrite: 'auth/canWrite',
      canLead: 'auth/canLead',
      canSwitchCong: 'auth/canSwitchCong',
      congregation: 'auth/congregation',
      territory: 'territory/territory',
      group: 'group/group',
      groups: 'group/groups',
    }),
    matchingRouteNames() {
      return this.$route.matched.map(r => r.name);
    },
    groupId() {
      return get(this.group, 'id') || get(this.groups, '[0].id') || 0;
    },
    isCampaignMode() {
      return get(this.user, 'congregation.campaign') || false;
    },
  },
  methods: {
    ...mapActions({
      checkinAll: 'territories/checkinAll',
      logout: 'auth/logout',
      updateCongregation: 'congregation/updateCongregation',
      getGroups: 'group/getGroups',
    }),
    get,
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
      await this.updateCongregation(cong);

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
    logoutUser() {
      this.logout();
      this.$router.push('/signout');
    },
    async getGroupsList() {
      if (!this.groups.length) {
        const congId = get(this.user, 'congregation.id');
        await this.getGroups({ congId });
      }
    },
  },
  watch: {
    async user() {
      await this.getGroupsList();
    },
  },
};
</script>
<style lang="scss">
.large-font-menu {
  font-size: 24px;
}
</style>
