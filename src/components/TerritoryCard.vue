<template>
  <div class="column">
    <div class="row justify-content-around">
      <div class="row w-50 align-items-center justify-content-start ml-0">
        <b-link :to="`/territories/${groupCode}/${terr.id}`" class="pr-4">
          <h5 class="mb-0">{{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span></h5>
        </b-link>
      </div>
      <div class="btn-group w-50 row justify-content-end pr-3" role="group" aria-label="Territory buttons">
        <b-btn 
          v-b-modal.checkoutModal 
          variant="info" 
          v-if="terr.status.status === 'Available' || terr.status.status === 'Recently Worked'" 
          @click="selectTerritory(terr)">
          check out
        </b-btn>
        <b-btn v-if="terr.status.status === 'Checked Out'" variant="outline-info" @click="checkinTerritory(terr)">check in</b-btn>
      </div>
    </div>
    <div class="text-right">
      <hr />
      <span class="assigned-to-info">{{assignedTo}}</span>
    </div>
  </div>
</template>
<script>
import { format } from 'date-fns';

export default {
  name: 'TerritoryCard',
  props: ['terr', 'groupCode', 'selectTerritory', 'refreshTerritories'],
  methods: {
    async checkinTerritory(territory) {
      const user = this.$store.state.auth.user;
      await this.$store.dispatch('territory/checkinTerritory', { 
        territoryId: territory.id, 
        userId: user.id, 
        username: user.username
      });

      this.refreshTerritories();
    },
  },
  computed: {
    isRecentlyWorked() {
      return this.terr && this.terr.status && this.terr.status.status === 'Recently Worked';
    },
    assignedTo() {
      if (this.terr && this.terr.status && this.terr.status.publisher) {
        const pre = this.isRecentlyWorked ? 'Recently assigned to' : 'Assigned to';
        return `${pre} ${this.terr.status.publisher.firstname} ${this.terr.status.publisher.lastname} on ${format(this.terr.status.date, 'MM/DD/YYYY')}`;
      }

      return '';
    },
  }
}
</script>
<style scoped>
  .assigned-to-info {
    font-size: 12px;
  }
</style>

