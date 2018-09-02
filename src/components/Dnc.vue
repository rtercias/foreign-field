<template>
  <div class="row pl-5 pt-5 justify-content-center">
    <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
    <template v-else>
      <font-awesome-icon icon="search" v-show="isEmpty"></font-awesome-icon>
      <font-awesome-icon icon="times" v-show="isDirty" @click="reset"></font-awesome-icon>
    </template>
    <input type="text" class="w-25 border-bottom h2" v-model="text" @keydown.esc="reset" @blur="reset" />
    <b-table class="text-left" striped :items="filteredDnc"></b-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      loading: false,
      isEmpty: false,
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
    }
  },
  methods: {
    reset() {
      this.text = '';
    },
  },
  mounted() {
    this.$store.dispatch('addresses/getDnc', this.id);
  }
}
</script>

<style scoped>

</style>
