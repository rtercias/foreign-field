<template>
  <div class="mx-2 mb-2">
    <div class="position-relative">
      <b-form-input v-model="keywordFilter" :placeholder="searchText" @keydown="keydown" />
      <font-awesome-icon
        class="search-btn position-absolute text-primary mr-2 mt-2"
        icon="search"
        @click="search">
      </font-awesome-icon>
    </div>
    <span v-if="results" class="d-block small pt-1 text-right">Count: {{results.length}}</span>
  </div>
</template>
<script>
export default {
  props: ['searchText', 'results'],
  data() {
    return {
      keywordFilter: '',
    };
  },
  methods: {
    search() {
      this.$emit('on-click', this.keywordFilter);
    },
    keydown(e) {
      if (e.keyCode === 13) {
        this.search();
      }
    },
  },
  watch: {
    keywordFilter() {
      this.$emit('on-change', this.keywordFilter);
    },
  },
};
</script>
<style lang="scss" scoped>
  .search-btn {
    right: 0;
    top: 2px;
  }
</style>
