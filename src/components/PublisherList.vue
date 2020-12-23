<template>
  <div>
    <div class="px-3 pt-3 d-flex justify-content-between">
      <span class="lead font-weight-bold">Publishers</span>
      <b-button v-if="canManage" variant="success" :to="`/publishers/add`">
        <font-awesome-icon icon="plus"></font-awesome-icon> Add
      </b-button>
    </div>
    <div class="w-100 justify-content-center">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
      <search-bar
        class="w-100 p-3"
        :search-text="'Search'"
        :model="text"
        @on-click="search"
        :no-padding="true"
      />
    </div>
    <div>
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
    };
  },
  async mounted() {
    if (this.congregationId) {
      await this.fetchPublishers(this.congregationId);
    }
  },
  computed: {
    ...mapGetters({
      publishers: 'publishers/publishers',
      canManage: 'auth/canManage',
    }),
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
    async search(_keyword) {
      // eslint-disable-next-line
      console.log('keyword', _keyword);
    // const congId = get(this.user, 'congregation.id');
    // const keyword = _keyword || this.keyword;
    // this.text = keyword;
    // await this.addressSearch({ congId, searchTerm: keyword });
    // await this.fetchAllTerritories({ congId, keyword });
    // await this.getDnc({ id: congId, keyword });
    },
  },
};
</script>

<style scoped>
</style>
