<template>
  <div class="sticky-top p-2 bg-white border-bottom" :style="{ top: top }">
    <div class="position-relative">
      <b-form-input v-model="keywordFilter" :placeholder="searchText" @keydown="keydown" />
      <font-awesome-icon
        class="search-btn position-absolute text-primary mr-2 mt-2"
        icon="search"
        @click="search">
      </font-awesome-icon>
    </div>
    <div class="d-flex justify-content-end">
      <b-check v-model="exclude" v-show="allowExclude && !!keywordFilter" class="w-50 text-left">
        <span class="small">Exclude Filter</span>
      </b-check>
      <span v-if="results" class="d-block small pt-1 text-right w-50">Count: {{results.length}}</span>
    </div>
  </div>
</template>
<script>
export default {
  props: ['searchText', 'results', 'allowExclude', 'top'],
  data() {
    return {
      keywordFilter: '',
      exclude: false,
    };
  },
  methods: {
    search() {
      this.$emit('on-click', this.keywordFilter, this.exclude);
    },
    keydown(e) {
      if (e.keyCode === 13) {
        this.search();
      }
    },
  },
  watch: {
    keywordFilter() {
      this.$emit('on-change', this.keywordFilter, this.exclude);
    },
    exclude() {
      this.$emit('on-change', this.keywordFilter, this.exclude);
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
