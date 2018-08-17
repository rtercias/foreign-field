<template>
  <div class="row justify-content-between">
    <b-link :to="`/territories/${groupCode}/${terr.id}`" class="w-75">
      <h5>{{terr.name}}<span v-if="terr.city"> - {{terr.city}}</span></h5>
    </b-link>
    <div class="btn-group w-25 row justify-content-end pr-3" role="group" aria-label="Territory buttons">
      <b-btn v-b-modal.checkoutModal variant="info" v-if="terr.status==='Available'" @click="selectTerritory(terr)">check out</b-btn>
      <b-button variant="outline-info" v-if="terr.status==='Checked Out'" @click="checkinTerritory(terr)">check in</b-button>
      <b-button class="recently-worked-button" variant="disabled" v-if="terr.status === 'Recently Worked'" v-b-tooltip.hover.boundary.viewport title="Recently Worked">
        <font-awesome-icon icon="ban" />
      </b-button>
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

