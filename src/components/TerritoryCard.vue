<template>
  <div class="row justify-content-between">
    <div class="row w-50 align-items-center justify-content-start ml-0">
      <b-link :to="`/territories/${groupCode}/${terr.id}`" class="pr-4">
        <h5 class="mb-0">{{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span></h5>
      </b-link>
    </div>
    <div class="btn-group w-50 row justify-content-end pr-3" role="group" aria-label="Territory buttons">
      <b-btn class="btn-outline-info" 
        v-if="terr.status.status === 'Checked Out' || terr.status.status === 'Recently Worked'" 
        v-b-popover.hover="`${assignedTo} ${assignedDate}`">
        <font-awesome-icon icon="info-circle" class="assigned-to-info" />
      </b-btn>
      <b-btn v-b-modal.checkoutModal variant="info" v-if="terr.status.status === 'Available'" @click="selectTerritory(terr)">check out</b-btn>
      <b-btn v-if="terr.status.status === 'Checked Out'" variant="outline-info" @click="checkinTerritory(terr)">check in</b-btn>
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
    assignedTo() {
      if (this.terr && this.terr.status && this.terr.status.publisher) {
        return `${this.terr.status.publisher.firstname} ${this.terr.status.publisher.lastname}`;
      }

      return '';
    },
    assignedDate() {
      if (this.terr && this.terr.status) {
        return format(this.terr.status.date, 'MM/DD/YYYY');
      }

      return '';
    }
  }
}
</script>
<style scoped>
  .assigned-to-info {
    font-size: 18px;
  }
</style>

