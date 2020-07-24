<template>
  <div class="optimize">
    <div class="optimize-header w-100 d-flex justify-content-between p-2">
      <b-button variant="warning" @click="switchToManual">Manual</b-button>
      <b-button variant="success" @click="switchToOptimize">Optimize</b-button>
    </div>
    <b-list-group class="columns">
      <b-list-group-item
        class="col-sm-12 overflow-auto"
        v-for="address in territory.addresses"
        v-bind:key="address.id"
        data-toggle="collapse">
        <OptimizeCard :address="address" :territoryId="id" :group="group" :mode="mode"></OptimizeCard>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import OptimizeCard from './OptimizeCard';

export default {
  name: 'Optimize',
  props: ['group', 'id'],
  components: {
    OptimizeCard,
  },
  data() {
    return {
      mode: 'optimize',
    };
  },
  async mounted() {
    this.setLeftNavRoute(`/territories/${this.group}/${this.id}`);
    await this.getTerritory(this.id);
  },
  methods: {
    ...mapActions({
      setLeftNavRoute: 'auth/setLeftNavRoute',
      getTerritory: 'territory/getTerritory',
    }),
    switchToManual() {
      this.mode = 'manual';
    },
    switchToOptimize() {
      this.mode = 'optimize';
    },
  },
  computed: {
    ...mapGetters({
      territory: 'territory/territory',
    }),
  },
};
</script>
<style scoped>

</style>
