<template>
  <div class="w-100 p-lg-5">
    <div class="w-100 row justify-content-center m-0 pt-2">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
      <template v-else>
        <input type="text" class="w-25 w-auto border-bottom h2" v-model="text" @keydown.esc="reset" @blur="reset" />
        <font-awesome-icon icon="search" v-show="isEmpty" class="search m-2"></font-awesome-icon>
        <font-awesome-icon icon="times" v-show="isDirty" @click="reset"></font-awesome-icon>
      </template>
    </div>
    <b-table class="text-left" striped :items="filteredDnc"></b-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      loading: false,
      isEmpty: true,
      isDirty: false,
      text: '',
      id: this.$route.params.id,
    };
  },
  computed: {
    ...mapGetters({
      dnc: 'addresses/dnc',
    }),
    filteredDnc() {
      if (this.text === '') {
        return [];
      }
      return this.dnc.filter(d => d.address.toLowerCase().indexOf(this.text.toLowerCase()) > -1);
    },
  },
  methods: {
    reset() {
      this.text = '';
    },
  },
  mounted() {
    this.$store.dispatch('addresses/getDnc', this.id);
  },
};
</script>

<style scoped>
  .search {
    font-size: 23px;
  }
</style>
