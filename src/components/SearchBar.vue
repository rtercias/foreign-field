<template>
  <div
    class="sticky-top bg-white"
    :style="{ top: top }"
    :class="{ 'p-0': noPadding, 'p-2 border-bottom': !noPadding }">
    <div :class="{
      'd-flex justify-content-between': showFilter,
      'position-relative': !showFilter,
      }">
      <b-form-input class="d-inline pr-5" v-model="keywordFilter" :placeholder="searchText" @keydown="keydown" />
      <div
        class="buttons"
        :class="{
        'align-items-center d-flex justify-content-between mx-0': showFilter,
        'position-absolute mr-1 mt-1 d-inline': !showFilter,
      }">
        <b-button
          title="Filter"
          v-if="showFilter && !model"
          :disabled="!keywordFilter"
          class="btn-sm bg-transparent border-0"
          :class="{ 'text-light no-pointer': !keywordFilter }"
          @click="filter">
          <font-awesome-icon class="text-primary" icon="filter" />
        </b-button>
        <b-button
          title="Clear"
          v-if="showFilter && !!model"
          class="btn-sm bg-transparent border-0"
          :class="{ 'text-light no-pointer': !keywordFilter }"
          @click="clear">
          <font-awesome-icon class="text-danger" icon="times" />
        </b-button>
        <b-button
          title="Exclude"
          v-if="allowExclude"
          :disabled="!keywordFilter"
          class="btn-sm bg-transparent border-0"
          :class="{ 'text-light no-pointer': !keywordFilter, 'mr-0': showSearch }"
          @click="exclude = !exclude">
          <font-awesome-icon class="text-primary" :icon="!exclude ? 'not-equal' : 'equals'" />
        </b-button>
        <b-button
          title="Search"
          v-if="showSearch"
          :disabled="!keywordFilter"
          class="btn-sm bg-transparent border-0"
          :class="{ 'text-light no-pointer': !keywordFilter }"
          @click="search">
          <font-awesome-icon class="text-primary" icon="search" />
        </b-button>
      </div>
    </div>
    <!-- <div class="d-flex justify-content-end">
      <b-check v-model="exclude" v-show="allowExclude && !!keywordFilter" class="w-50 text-left">
        <span class="small">Exclude Filter</span>
      </b-check>
      <span v-if="results" class="d-block small pt-1 text-right w-50">Count: {{results.length}}</span>
    </div> -->
  </div>
</template>
<script>
export default {
  props: ['searchText', 'model', 'results', 'allowExclude', 'top', 'noPadding'],
  data() {
    return {
      keywordFilter: '',
      exclude: false,
    };
  },
  mounted() {
    this.keywordFilter = this.model;
  },
  methods: {
    search() {
      this.$emit('on-click', this.keywordFilter, this.exclude);
    },
    filter() {
      this.exclude = false;
      this.$emit('on-filter', this.keywordFilter, this.exclude);
    },
    clear() {
      this.keywordFilter = '';
      this.filter();
    },
    keydown(e) {
      if (e.keyCode === 13) {
        this.search();
      }
    },
  },
  computed: {
    showFilter() {
      return !!this.$listeners['on-filter'] || !!this.$listeners['on-change'];
    },
    showSearch() {
      return !!this.$listeners['on-click'];
    },
  },
  watch: {
    keywordFilter() {
      if (!this.keywordFilter) this.clear();
      this.$emit('on-change', this.keywordFilter, this.exclude);
    },
    exclude() {
      this.$emit('on-change', this.keywordFilter, this.exclude);
      if (this.showFilter) this.$emit('on-filter', this.keywordFilter, this.exclude);
    },
    model() {
      this.keywordFilter = this.model;
    },
  },
};
</script>
<style lang="scss" scoped>
  .buttons {
    right: 5px;
    .svg-inline--fa {
      cursor: pointer;
    }
    .no-pointer {
      cursor: default;
    }
  }
</style>
