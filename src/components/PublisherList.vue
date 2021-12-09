<template>
  <div>
    <div class="d-flex justify-content-between">
      <span class="lead font-weight-bold">Publishers</span>
      <b-button v-if="canManage" variant="success" :to="`/publishers/add`">
        <font-awesome-icon icon="plus"></font-awesome-icon> Add
      </b-button>
    </div>
    <div class="w-100 justify-content-center pt-2">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
      <search-bar
        class="w-100 mb-3"
        :search-text="'Search'"
        :model="text"
        :results="publishers"
        @on-change="filter"
        :no-padding="true"
      />
    </div>
    <div>
      <b-check v-model="activeOnly" class="w-50 text-left">
        <span class="small">Active only</span>
      </b-check>
      <b-table
        class="publishers-list border-bottom"
        :fields="fields"
        :items="displayedPublishers"
        :per-page="perPage"
        :current-page="currentPage">
        <template #cell(name)="data">
          <span class="name">{{ data.value }}</span>
          <b-badge
            v-if="['PUB', 'RP'].includes(data.item.role)"
            class="ml-2 btn"
            variant="warning"
            :to="{ name: 'publisher-token',
              query: { username: data.item.username },
            }"
          >
            get token
          </b-badge>
        </template>
        <template #cell(id)="data">
          <b-link v-if="canManage" :to="`/publishers/${data.item.edit}/edit`">
            <font-awesome-icon
              class="small text-primary"
              icon="pencil-alt"
            />
          </b-link>
        </template>
      </b-table>
    </div>
    <b-pagination
      class="justify-content-center"
      v-model="currentPage"
      :total-rows="publishers.length"
      limit="3"
      :per-page="perPage"
      size="sm">
    </b-pagination>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SearchBar from './SearchBar';
import { displayName } from '../utils/publisher';

export default {
  name: 'PublisherList',
  props: ['congregationId'],
  components: {
    SearchBar,
  },
  data() {
    return {
      loading: false,
      isEmpty: true,
      isDirty: false,
      text: this.$route.params.keyword,
      id: this.$route.params.id,
      activeOnly: true,
      keywordFilter: '',
      perPage: 5,
      currentPage: 1,
      fields: ['name', 'id'],
    };
  },
  async mounted() {
    if (this.congregationId) {
      await this.fetchPublishers(this.congregationId);
    }
  },
  computed: {
    ...mapGetters({
      pubs: 'publishers/publishers',
      canManage: 'auth/canManage',
      user: 'auth/user',
    }),
    publishers() {
      let publishers = this.pubs;

      if (this.activeOnly) {
        publishers = publishers.filter(p => !!p.status);
      }

      if (this.keywordFilter) {
        publishers = publishers.filter(p => this.compareToKeyword(this.keywordFilter, [
          p.firstname,
          p.lastname,
          p.username,
        ]));
      }
      return publishers;
    },
    displayedPublishers() {
      return this.publishers.map(p => ({ name: displayName(p), edit: p.id, ...p }));
    },
  },
  methods: {
    ...mapActions({
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    reset() {
      this.text = '';
    },
    compareToKeyword(filter, values) {
      return values.reduce(
        (acc, value) => acc || String(value).toLowerCase().includes(filter.toLowerCase()),
        false,
      );
    },
    filter(keyword) {
      this.keywordFilter = keyword;
    },
  },
  watch: {
    async user() {
      if (this.congregationId) {
        await this.fetchPublishers(this.congregationId);
      }
    },
  },
};
</script>

<style lang="scss">
  .publishers-list {
    thead {
      display: none;
    }
    td:nth-child(1) {
      text-align: left;
      border-left: solid 1px rgba(0, 0, 0, 0.125);
    }
    td:nth-child(2) {
      text-align: right;
      border-right: solid 1px rgba(0, 0, 0, 0.125);
    }
  }
</style>
