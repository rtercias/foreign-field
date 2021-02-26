<template>
  <div
    class="sticky-top bg-white"
    :style="{ top: top }"
    :class="{ 'p-0': noPadding, 'p-2 border-bottom': !noPadding }">
    <div :class="{
      'd-flex justify-content-between': showFilter,
      'position-relative': !showFilter,
      }">
      <b-form-input class="d-inline" v-model="keywordFilter" :placeholder="searchText" @keydown="keydown" />
      <div
        class="buttons"
        :class="{
        'align-items-center d-flex justify-content-between mx-2': showFilter,
        'position-absolute mr-2 mt-2 d-inline': !showFilter,
      }">
        <i title="Filter">
          <font-awesome-icon
            v-if="showFilter && !model"
            :disabled="!keywordFilter"
            class="text-primary mr-3"
            :class="{ 'text-light no-pointer': !keywordFilter }"
            icon="filter"
            @click="filter" />
        </i>
        <i title="Clear">
          <font-awesome-icon
            v-if="showFilter && !!model"
            class="text-danger mr-3"
            :class="{ 'text-light no-pointer': !keywordFilter }"
            icon="times"
            @click="clear" />
        </i>
        <i title="Exclude">
          <font-awesome-icon
            v-if="allowExclude"
            :disabled="!keywordFilter"
            class="text-primary mr-3"
            :class="{ 'text-light no-pointer': !keywordFilter }"
            :icon="!exclude ? 'not-equal' : 'equals'"
            @click="exclude = !exclude" />
      </i>
      <i title="Search">
        <font-awesome-icon
          :disabled="!keywordFilter"
          class="text-primary"
          :class="{ 'text-light no-pointer': !keywordFilter }"
          icon="search"
          @click="search" />
      </i>
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
      return !!this.$listeners['on-filter'];
    },
  },
  watch: {
    keywordFilter() {
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
