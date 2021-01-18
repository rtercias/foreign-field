<template>
  <div class="column">
    <div class="row justify-content-between px-2">
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
      <div class="check-in-out" size="small" role="group">
        <b-btn
          class="text-light font-weight-bold"
          v-b-modal.checkoutModal
          variant="info"
          v-if="canWrite && (status === 'Available' || status === 'Recently Worked')"
          @click="selectTerritory(terr)"
          :disabled="saving">
          <font-awesome-icon v-if="saving" icon="circle-notch" spin></font-awesome-icon>
          check out
        </b-btn>
        <b-btn
          class="font-weight-bold"
          v-if="canWrite && status === 'Checked Out'"
          variant="outline-info"
          @click="checkin(terr)"
          :disabled="saving">
          <font-awesome-icon v-if="saving" icon="circle-notch" spin></font-awesome-icon>
          check in
        </b-btn>
      </div>
    </div>
    <div class="text-right">
      <b-badge
        :to="{ name: 'territory-edit', params: { territoryId: terr.id } }"
        class="px-2 py-1 small"
        v-if="canManage">
        <font-awesome-icon
          class="text-primary mr-2"
          icon="pencil-alt"
        />
        <span>ID: {{terr.id}}</span>
      </b-badge>
      <hr class="my-2" />
      <div class="assigned-to-info">{{assignedTo}}</div>
      <div class="d-flex justify-content-between">
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
        <div>
          <div class="last-worked" v-if="terr.lastActivity">Last worked: {{lastWorked}}</div>
          <div v-else class="loading">
            <div v-if="terr.lastActivityLoading" class="font-weight-bold m-0 medium">
              <font-awesome-icon icon="circle-notch" spin></font-awesome-icon>
            </div>
            <b-button v-else class="get-last-activity p-0" variant="link" @click="() => fetchLastWorked(terr.id)">
              Get last activity
            </b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';

export default {
  name: 'TerritoryCard',
  props: ['terr', 'groupId', 'selectTerritory', 'fetch', 'typeFilters'],
  data() {
    return {
      saving: false,
    };
  },
  methods: {
    ...mapActions({
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritoryActivities: 'territory/resetTerritoryActivities',
      fetchLastActivity: 'territories/fetchLastActivity',
    }),
    async checkin(territory) {
      const response = await this.$bvModal.msgBoxConfirm('Ready to check-in the territory?', {
        title: `${territory.name}`,
        centered: true,
      });

      if (response) {
        const publisher = territory.status && territory.status.publisher || {};
        const { user } = this.$store.state.auth;
        await this.checkinTerritory({
          territoryId: territory.id,
          userId: publisher.id,
          username: user.username,
        });

        this.saving = true;
        await this.resetTerritoryActivities({
          checkoutId: territory.status.checkout_id,
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
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      canWrite: 'auth/canWrite',
      canManage: 'auth/canManage',
      territories: 'territories/territories',
    }),

    isRecentlyWorked() {
      return this.status === 'Recently Worked';
    },
    assignedTo() {
      if (this.terr && this.terr.status && this.terr.status.publisher) {
        const pre = this.isRecentlyWorked
          ? 'Recently completed'
          : `Assigned to ${this.terr.status.publisher.firstname} ${this.terr.status.publisher.lastname}`;
        const timestamp = Number(this.terr.status.date);
        const formattedDate = (!Number.isNaN(timestamp) && ` on ${format(new Date(timestamp), 'MM/dd/yyyy')}`) || '';
        return `${pre}${formattedDate}`;
      }

      return '';
    },
    status() {
      return this.terr && this.terr.status && this.terr.status.status || 'Available';
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
<style scoped>
  .terr-name {
    font-size: 18px;
  }
  .check-in-out .btn {
    min-width: 100px;
  }
  .assigned-to-info, .last-worked, .loading, .get-last-activity {
    font-size: 12px;
  }
</style>
