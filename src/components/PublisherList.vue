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
      <b-list-group>
        <b-list-group-item v-for="pub in publishers" :key="pub.id">
          <div class="d-flex justify-content-between">
            {{displayName(pub)}}
            <b-link :to="`/publishers/${pub.id}/edit`">
              <font-awesome-icon
                class="small text-primary"
                icon="pencil-alt"
              />
            </b-link>
          </div>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SearchBar from './SearchBar';

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
        publishers = publishers.filter(p => p.status === 'active');
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
  },
  methods: {
    ...mapActions({
      fetchPublishers: 'publishers/fetchPublishers',
    }),
    displayName(pub) {
      if (pub.firstname && pub.lastname) {
        return `${pub.firstname} ${pub.lastname}`;
      }
      return pub.username;
    },
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

<style scoped>
</style>
