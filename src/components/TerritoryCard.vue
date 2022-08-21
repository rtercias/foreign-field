<template>
  <div class="column">
    <div class="row justify-content-between">
      <div>
        <b-link :to="`/territories/${terr.id}`" class="column">
          <h5 class="mb-0">
            {{`${primaryDescription}${territoryDescriptions.length > 1
              ? ` +${territoryDescriptions.length-1}`
              : ''}` || terr.name}}
          </h5>
          <span class="terr-name">{{primaryDescription && terr.name}}</span>
        </b-link>
      </div>
      <div class="check-in-out text-right d-flex flex-column justify-content-start" size="small" role="group">
        <font-awesome-icon icon="circle-notch" spin v-if="loadingStatuses" class="text-black-50" />
        <b-btn
          class="font-weight-bold p-1 btn-sm"
          v-b-modal = "`checkoutModal-${terr.id}`"
          variant="primary"
          v-else-if="canWrite && (status === 'Available' || status === 'Recently Worked')"
          @click="isReassign = false"
          :disabled="saving">
          <font-awesome-icon v-if="terr.isBusy" icon="circle-notch" spin></font-awesome-icon>
          Check Out
        </b-btn>
        <div v-else-if="status === 'Checked Out'" class="d-flex flex-column">
          <b-btn
            class="font-weight-bold p-1 btn-sm"
            v-if="canWrite"
            variant="warning"
            @click="checkin"
            :disabled="saving">
            <font-awesome-icon v-if="saving" icon="circle-notch" spin></font-awesome-icon>
            Check In
          </b-btn>
          <b-btn
            class="mr-0 pr-0 pb-0 pt-2"
            v-b-modal = "`checkoutModal-${terr.id}`"
            v-if="canViewReports"
            variant="link"
            @click="isReassign = true"
            :disabled="saving">
            <font-awesome-icon v-if="terr.isBusy" icon="circle-notch" spin></font-awesome-icon>
            Reassign
          </b-btn>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="w-100 d-flex justify-content-between align-items-end">
        <div class="territory-details">
          <b-badge variant="link" class="btn-link mr-1 text-black-50" @click="showTerrInfo('phoneAddress')">
            ID: {{terr.id}}
          </b-badge>
          <b-badge variant="link" class="btn-link mr-1 text-black-50" @click="showTerrInfo('phoneAddress')">
            Addresses: {{terr.addressCount}}
          </b-badge>
          <b-badge variant="link" class="btn-link mr-1 text-black-50" @click="showTerrInfo('phoneAddress')">
            Phones: {{terr.phoneCount}}
          </b-badge>
        </div>
        <b-link
          v-if="canManage"
          :to="{ name: 'territory-edit', params: { territoryId: terr.id } }"
          class="text-nowrap small">
          <font-awesome-icon
            class="small text-primary"
            icon="pencil-alt"
          /> Edit
        </b-link>
      </div>
      <hr class="my-2 w-100" />
      <div class="assigned-to-info w-100 text-right" @click="showTerrInfo('assignedTo')">
        {{assignedTo()}}
      </div>
      <div class="d-flex justify-content-between w-100">
        <div>
          <b-badge
            alert
            class="territory-type mr-1"
            :variant="typeFilter(terr.type).variant"
            v-if="terr.type !== 'Regular'">
            {{typeFilter(terr.type).text}}
          </b-badge>
          <b-badge class="mr-1" v-for="(tag, index) in tags" :key="index">{{tag}}</b-badge>
        </div>
      </div>
    </div>
    <CheckoutModal :territory="terr" :is-reassign="isReassign"></CheckoutModal>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';
import get from 'lodash/get';
import CheckoutModal from './CheckoutModal.vue';
import { displayName } from '../utils/publisher';

export default {
  name: 'TerritoryCard',
  props: [
    'terr',
    'groupId',
    'selectTerritory',
    'fetch',
    'typeFilters',
    'showAddressCount',
    'showPhoneCount',
  ],
  components: {
    CheckoutModal,
  },
  data() {
    return {
      saving: false,
      isReassign: false,
    };
  },
  methods: {
    ...mapActions({
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
      fetchLastActivity: 'territories/fetchLastActivity',
      updateTerritory: 'territories/updateTerritory',
      setTerritory: 'territory/setTerritory',
    }),
    displayName,
    async checkin() {
      const response = await this.$bvModal.msgBoxConfirm('Ready to check-in the territory?', {
        title: `${this.terr.name}`,
        centered: true,
      });

      if (response) {
        this.saving = true;
        const publisher = this.terr.status && this.terr.status.publisher || {};
        const { user } = this.$store.state.auth;
        const checkoutId = get(this.terr, 'status.checkout_id');
        await this.checkinTerritory({
          checkoutId,
          territoryId: this.terr.id,
          publisher: publisher || {},
          username: user.username,
          date: Date.now(),
        });

        this.resetTerritoryActivities({
          checkoutId,
          userid: this.user.id,
          tzOffset: new Date().getTimezoneOffset().toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        this.saving = false;

        await this.fetch();
      }
    },
    async fetchLastWorked(territoryId) {
      this.$set(this.terr, 'lastActivityLoading', true);
      await this.fetchLastActivity(territoryId);
      const vuexTerritory = this.territories.find(t => t.id === this.terr.id);
      this.$set(this.terr, 'lastActivity', vuexTerritory.lastActivity);
      this.$set(this.terr, 'lastActivityLoading', false);
    },
    typeFilter(type) {
      return this.typeFilters.find(t => t.value === type) || {};
    },
    showTerrInfo(type) {
      const h = this.$createElement;
      const messages = {
        phoneAddress: h('p', {
          domProps: {
            innerHTML: `
              <div>ID: ${this.terr.id}</div>
              <div>Address Count: ${get(this.terr, 'addressCount', 0)}</div>
              <div>Phone Count: ${get(this.terr, 'phoneCount', 0)}</div>
            `,
          },
        }),
        assignedTo: h('p', {
          domProps: {
            innerHTML: `
              ${this.assignedTo(true)}
            `,
          },
        }),
      };

      this.$bvModal.msgBoxOk(messages[type], {
        title: 'Checkout Status',
        centered: true,
      });
    },
    assignedTo(showFull) {
      if (this.terr && this.terr.status && this.terr.status.publisher) {
        const isFree = this.isRecentlyWorked || this.isAvailable;
        const name = showFull ? `${isFree ? 'by ' : ''}${displayName(this.terr.status.publisher)}` : '';
        const pre = isFree ? `Last completed ${name}` : `Assigned to ${displayName(this.terr.status.publisher)}`;
        const formattedDate = this.terr.status.date ? ` on ${this.terr.status.date}` : '';
        const { name: campaignName } = this.currentCampaign;
        const campaign = this.terr.status.campaign ? `Campaign: ${campaignName}` : '';
        return `${pre}${(showFull || isFree) ? formattedDate : ''}${showFull ? `<br/>${campaign}` : ''}`;
      }

      return '';
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      canViewReports: 'auth/canViewReports',
      canManage: 'auth/canManage',
      territories: 'territories/territories',
      territory: 'territory/territory',
      isCheckingOut: 'territory/isCheckingOut',
      loadingStatuses: 'territories/loadingStatuses',
    }),

    isRecentlyWorked() {
      return this.status === 'Recently Worked';
    },
    isAvailable() {
      return this.status === 'Available';
    },
    status() {
      return this.terr && this.terr.status && this.terr.status.status || 'Available';
    },
    currentCampaign() {
      const campaignId = get(this.terr, 'status.campaign_id') || null;
      const historicalCampaigns = get(this.user, 'congregation.historicalCampaigns') || [];
      return historicalCampaigns.find(h => h.id === campaignId) || {};
    },
    territoryDescriptions() {
      return this.terr && this.terr.description ? this.terr.description.split(',') : [];
    },
    primaryDescription() {
      return this.territoryDescriptions[0];
    },
    lastWorked() {
      const timestamp = this.terr.lastActivity && Number(this.terr.lastActivity.timestamp);
      if (!timestamp || timestamp === 0) {
        return '';
      }

      return format(new Date(timestamp), 'MM/dd/yyyy');
    },
    tags() {
      return this.terr.tags ? this.terr.tags.split(',') : [];
    },
  },
};
</script>
<style lang="scss" scoped>
  .terr-name {
    font-size: 18px;
  }
  .territory-details {
    span {
      cursor: pointer;
    }
  }
  .check-in-out * {
    font-size: 12px;
  }
  .assigned-to-info, .last-worked, .loading, .get-last-activity, .show-checkout-details {
    font-size: 12px;
  }
  .assigned-to-info:hover {
    text-decoration: underline;
    cursor: pointer;
  }
</style>
