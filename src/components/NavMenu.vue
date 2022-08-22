<template>
  <b-navbar-nav
    class="pt-3 flex-column large-font-menu font-weight-bold sticky-top"
    :class="{ 'text-left': isDesktop }">
    <b-nav-item to="/">Home</b-nav-item>
    <b-nav-item
      v-if="canWrite && !isForcedOut"
      :to="{ name: 'congregation-edit', params: { congregationId: congregation.id } }">
      {{congregation.name}}
    </b-nav-item>
    <b-nav-item v-if="canSwitchCong && !isForcedOut" :to="{ name: 'congregation-switch' }">Switch Cong</b-nav-item>
    <b-nav-item v-if="canWrite && !isForcedOut" :to="`/groups/${groupId}`">Territories</b-nav-item>
    <b-nav-item
      v-if="canWrite && matchingRouteNames.includes('territory')"
      :to="`/territories/${territory && territory.id}/optimize`">
      Optimize
    </b-nav-item>
    <b-nav-item
      v-if="canLead && !isForcedOut">
      <span :class="{ 'text-warning': isCampaignMode }" @click="toggleCampaignMode">
        <font-awesome-icon v-if="togglingCampaignMode" icon="circle-notch" spin />
        <font-awesome-icon v-else :icon="isCampaignMode ? 'ban' : 'bolt'" />
        {{isCampaignMode ? 'End Campaign' : 'New Campaign'}}
      </span>
      <font-awesome-icon class="mb-2 text-info campaign-info" icon="info-circle" @click="toggleCampaignHelp" />
      <b-toaster name="campaign-help"></b-toaster>
    </b-nav-item>
    <b-nav-item-dropdown v-if="isAuthenticated">
      <span slot="text">{{user && user.firstname || name}}</span>
      <b-dropdown-item
        class="m-0 w-100"
        v-if="!isForcedOut"
        :to="{
          name: 'publisher-edit',
          params: { publisherId: get(user, 'id', 0) },
        }">
        Profile
      </b-dropdown-item>
      <b-dropdown-item class="m-0 w-100" v-if="canHelpLogin && !isForcedOut" :to="`/publishers/token`">
        Login Helper
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
    this.$root.$on('bv::modal::shown', (bvEvent, modalId) => {
      if (modalId === 'start-campaign') {
        if (this.$refs.campaignName) {
          this.$refs.campaignName.select();
        }
      }
    });

    await this.getGroupsList();
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      isDesktop: 'auth/isDesktop',
      isForcedOut: 'auth/isForcedOut',
      user: 'auth/user',
      name: 'auth/name',
      canWrite: 'auth/canWrite',
      canLead: 'auth/canLead',
      canSwitchCong: 'auth/canSwitchCong',
      canHelpLogin: 'auth/canHelpLogin',
      congregation: 'auth/congregation',
      territory: 'territory/territory',
      group: 'group/group',
      groups: 'group/groups',
    }),
    matchingRouteNames() {
      return this.$route.matched.map(r => r.name);
    },
    groupId() {
      const { id = 0, code } = this.group;
      return code === 'ALL' ? 0 : id || get(this.territory, 'group_id') || 0;
    },
    isCampaignMode() {
      return !!get(this.user, 'congregation.currentCampaign');
    },
  },
  methods: {
    ...mapActions({
      checkinAll: 'territories/checkinAll',
      logout: 'auth/logout',
      updateCongregation: 'congregation/updateCongregation',
      getGroups: 'group/getGroups',
      startCongCampaign: 'congregation/startCampaign',
      endCongCampaign: 'congregation/endCampaign',
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
      const campaignId = get(cong, 'currentCampaign.id');
      if (campaignId) {
        await this.$bvModal.msgBoxConfirm('A campaign is already in progress', {
          title: 'Start Campaign',
          centered: true,
        });

        return;
      }

      // using let instead of const here because it's being used
      // as the v-model for the msgbox input
      let name = 'Campaign'; // eslint-disable-line prefer-const
      const modalId = 'start-campaign';
      const response = await this.$bvModal.msgBoxConfirm(
        <input ref="campaignName" vModel={name} class="w-100" />, {
          id: modalId,
          title: 'What is the name of the new campaign?',
          centered: true,
        },
      );
      if (!response) return;
      this.togglingCampaignMode = true;

      // Step 1: toggle campaign mode
      try {
        await this.startCongCampaign({ name, congId: cong.id, publisherId: this.user.id });
      } catch (error) {
        console.log('error', error);
        this.$router.push({ name: 'error', query: { error: 'Unable to start campaign.' } });
        return;
      }

      this.$bvToast.toast(`Campaign has started. Checking in all territories.
        We'll let you know when it's done.`, {
        variant: 'warning',
      });

      // Step 2: check in all
      await this.checkinAll({
        congId: cong.id,
        username: this.user.username,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      this.togglingCampaignMode = false;
      this.$bvToast.toast('All territories have been checked in.', {
        variant: 'warning',
      });
      this.$router.go();
    },
    async endCampaign() {
      const cong = { ...this.user.congregation };
      const message = 'End the current campaign?';
      const response = await this.$bvModal.msgBoxConfirm(message, {
        title: `${get(cong, 'currentCampaign.name') || 'Campaign'}`,
        centered: true,
      });

      if (!response) return;
      this.togglingCampaignMode = true;

      // Step 1: toggle campaign mode
      const campaignId = get(cong, 'currentCampaign.id');
      if (!campaignId) {
        await this.$bvModal.msgBoxConfirm('No current campaign found', {
          title: 'End Campaign',
          centered: true,
        });

        return;
      }

      try {
        await this.endCongCampaign({ campaignId });
      } catch (error) {
        this.$router.push({ name: 'error', query: { error: 'Unable to end campaign.' } });
        return;
      }

      this.$bvToast.toast(`Campaign has ended. Checking in all territories.
        We'll let you know when it's done.`, {
        variant: 'warning',
      });

      // Step 2: check in all
      await this.checkinAll({
        congId: cong.id,
        username: this.user.username,
        tzOffset: new Date().getTimezoneOffset().toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      this.togglingCampaignMode = false;
      this.$bvToast.toast('All territories have been checked in.', {
        variant: 'warning',
      });
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
        const congId = get(this.user, 'congregation.id') || get(this.congregation, 'id');
        if (congId) await this.getGroups({ congId });
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
.campaign-info {
  font-size: 14px;
}
</style>
