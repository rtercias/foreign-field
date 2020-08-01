<template>
  <div class="column">
    <div class="row justify-content-between pl-2 pr-2">
      <div>
        <b-link :to="`/territories/${groupCode}/${terr.id}`" class="pr-4 column">
          <h5 class="mb-0">{{`${primaryCity}${cityNames.length > 1 ? ` +${cityNames.length-1}` : ''}` || terr.name}}</h5>
          <span class="terr-name">{{primaryCity && terr.name}}</span>
        </b-link>
      </div>
      <div class="check-in-out" size="small" role="group">
        <b-btn
          v-b-modal.checkoutModal
          variant="info"
          v-if="canWrite && (status === 'Available' || status === 'Recently Worked')"
          @click="selectTerritory(terr)"
          :disabled="saving">
          <font-awesome-icon v-if="saving" icon="circle-notch" spin></font-awesome-icon>
          check out
        </b-btn>
        <b-btn
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
      <hr class="mb-2 mt-2" />
      <div class="assigned-to-info">{{assignedTo}}</div>
      <div class="last-worked" v-if="lastWorked">Last worked: {{lastWorked}}</div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import format from 'date-fns/format';

export default {
  name: 'TerritoryCard',
  props: ['terr', 'groupCode', 'selectTerritory', 'fetch'],
  data() {
    return {
      saving: false,
    };
  },
  methods: {
    ...mapActions({
      fetchTerritories: 'territories/fetchTerritories',
      checkinTerritory: 'territory/checkinTerritory',
      resetTerritory: 'territory/resetTerritory',
      getTerritory: 'territory/getTerritory',
      resetNHRecords: 'territory/resetNHRecords',
    }),
    async checkin(territory) {
      const publisher = territory.status && territory.status.publisher || {};
      const { user } = this.$store.state.auth;
      await this.checkinTerritory({
        territoryId: territory.id,
        userId: publisher.id,
        username: user.username,
      });

      if (window.confirm('Check-in successful. Do you want to reset NH records?')) {
        this.saving = true;
        await this.resetNHRecords(territory.id);
        this.saving = false;
      }

      this.fetch();
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      canWrite: 'auth/canWrite',
    }),

    isRecentlyWorked() {
      return this.status === 'Recently Worked';
    },
    assignedTo() {
      if (this.terr && this.terr.status && this.terr.status.publisher) {
        const pre = this.isRecentlyWorked ? 'Recently assigned to' : 'Assigned to';
        const timestamp = Number(this.terr.status.date);
        const formattedDate = (!Number.isNaN(timestamp) && ` on ${format(new Date(timestamp), 'MM/dd/yyyy')}`) || '';

        return `${pre} ${this.terr.status.publisher.firstname} `
          + `${this.terr.status.publisher.lastname}${formattedDate}`;
      }

      return '';
    },
    status() {
      return this.terr && this.terr.status && this.terr.status.status || 'Available';
    },
    cityNames() {
      return this.terr && this.terr.city ? this.terr.city.split(',') : [];
    },
    primaryCity() {
      return this.cityNames[0];
    },
    lastWorked() {
      const timestamp = Number(this.terr.lastActivity.timestamp);
      if (timestamp === 0) {
        return '';
      }

      return format(new Date(timestamp), 'MM/dd/yyyy');
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
  .assigned-to-info, .last-worked {
    font-size: 12px;
  }
</style>
