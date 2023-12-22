<template>
  <div
    class="search-bar sticky-top bg-light"
    :style="{ top: top }"
    :class="{ 'p-0': noPadding, 'p-2': !noPadding }">
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
          title="Search"
          v-if="showSearch"
          :disabled="!keywordFilter"
          class="search-btn bg-transparent border-0"
          :class="{ 'text-light no-pointer': !keywordFilter }"
          @click="search">
          <font-awesome-icon class="text-primary" icon="search" />
        </b-button>
      </div>
    </div>
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
  .search-bar {
    z-index: 1;
    .search-btn {
      font-size: 18px;
    }
    .buttons {
      right: 5px;
      .svg-inline--fa {
        cursor: pointer;
      }
      .no-pointer {
        cursor: default;
      }
    }
  }

  @media print {
    .search-bar {
      display: none !important;
    }
  }
</style>
