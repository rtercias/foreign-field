<template>
  <div class="row justify-content-between">
    <div class="row w-75 align-items-center">
      <b-link :to="`/territories/${groupCode}/${terr.id}`" class="pr-4">
        <h5 class="mb-0">{{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span></h5>
      </b-link>
      <b-badge class="h-50" variant="warning" v-if="terr.status === 'Recently Worked'">Recently Worked</b-badge>
    </div>
    <div class="btn-group w-25 row justify-content-end pr-3" role="group" aria-label="Territory buttons">
      <b-btn v-b-modal.checkoutModal variant="info" v-if="terr.status==='Available'" @click="selectTerritory(terr)">check out</b-btn>
      <b-button variant="outline-info" v-if="terr.status === 'Checked Out' || terr.status === 'Recently Worked'" @click="checkinTerritory(terr)">check in</b-button>
    </div>
  </div>
</template>
<script>
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
  }
}
</script>
<style scoped>

</style>

