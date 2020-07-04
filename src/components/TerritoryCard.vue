<template>
  <div class="column">
    <div class="row justify-content-around">
      <div class="row w-50 align-items-center justify-content-start ml-0">
        <b-link :to="`/territories/${groupCode}/${terr.id}`" class="pr-4 column">
          <h5 class="mb-0">{{terr.name}}</h5>
          <span class="city-name" v-if="terr.city">{{terr.city}}</span>
        </b-link>
      </div>
      <div class="btn-group w-50 row justify-content-end pr-3" role="group" aria-label="Territory buttons">
        <b-btn
          v-b-modal.checkoutModal
          variant="info"
          v-if="canWrite && (status === 'Available' || status === 'Recently Worked')"
          @click="selectTerritory(terr)">
          check out
        </b-btn>
        <b-btn
          v-if="canWrite && status === 'Checked Out'"
          variant="outline-info"
          @click="checkin(terr)">check in</b-btn>
      </div>
    </div>
    <div class="text-right">
      <hr class="mb-2" />
      <span class="assigned-to-info d-block">{{assignedTo}}</span>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'TerritoryCard',
  props: ['terr', 'groupCode', 'selectTerritory', 'fetch'],
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
        await this.resetNHRecords(territory.id);
      }

      this.fetch();
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      territoryWithAddresses: 'territory/territory',
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
  },
};
</script>
<style scoped>
  .city-name {
    font-size: 18px;
  }
  .assigned-to-info {
    font-size: 12px;
    height: 15px;
  }
</style>
