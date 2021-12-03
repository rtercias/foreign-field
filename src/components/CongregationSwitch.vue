<template>
  <div>
    <loading v-if="isLoading" />
    <div v-else>
      <h5 class="mt-5">SWITCH CONGREGATION</h5>
      <div class="mx-5">
        <div class="text-left">
          <h5 class="mt-5">1. Select a circuit</h5>
          <b-dropdown class="circuits">
            <span slot="button-content">{{selectedCircuit || 'no selection'}}</span>
            <b-dropdown-item
              v-for='(circuit, index) in circuits'
              :key="index"
              @click="() => selectCircuit(circuit)">
              {{circuit}}
            </b-dropdown-item>
          </b-dropdown>
        </div>
        <div class="text-left">
          <h5 class="mt-5" :class="{ 'text-light': !selectedCircuit }">2. Select a congregation</h5>
          <b-dropdown class="congregations" :disabled="!selectedCircuit">
            <span slot="button-content">{{selectedCongregation || get(congregation, 'name') || 'no selection'}}</span>
            <b-dropdown-item
              v-for='(cong, index) in congregationsByCircuit'
              :key="index"
              @click="() => switchCongregation(cong)">
              {{cong.name}}
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import { validate } from '../store/modules/models/PublisherModel.js';
import Loading from './Loading';

export default {
  name: 'CongregationSwitch',
  components: {
    Loading,
  },
  data() {
    return {
      circuits: ['NJ-16'],
      selectedCircuit: '',
      selectedCongregation: '',
      isLoading: false,
    };
  },
  mounted() {
    this.populateCircuits();
  },
  methods: {
    ...mapActions({
      updatePublisher: 'publisher/updatePublisher',
      getCongregationsByCircuit: 'congregation/getCongregationsByCircuit',
    }),
    get,
    populateCircuits() {
      if (this.isAdmin) {
        this.circuits.push(...['Test', 'Unassigned']);
      }
    },
    async selectCircuit(circuit) {
      this.selectedCircuit = circuit;
      await this.getCongregationsByCircuit(circuit);
    },
    async switchCongregation(cong) {
      const message = `Are you sure you want to switch to ${cong.name}?`;
      const confirm = await this.$bvModal.msgBoxConfirm(message, {
        title: 'Switch Congregation',
        centered: true,
      });
      if (confirm) {
        this.isLoading = true;
        const publisher = validate({ congregationid: cong.id, ...this.user });
        await this.updatePublisher(publisher);
        this.selectedCongregation = cong.name;
        this.isLoading = false;
        this.$router.go();
      }
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      congregationsByCircuit: 'congregation/congregationsByCircuit',
      congregation: 'auth/congregation',
      isAdmin: 'auth/isAdmin',
    }),
  },
  watch: {
    user() {
      this.populateCircuits();
    },
  },
};
</script>
<style lang="scss">
</style>
