<template>
  <div>
    <div class="d-flex justify-content-between">
      <span class="lead font-weight-bold">Groups</span>
      <b-button v-if="canManage" variant="success" :to="`/groups/add`">
        <font-awesome-icon icon="plus"></font-awesome-icon> Add
      </b-button>
    </div>
    <div class="w-100 justify-content-center pb-3">
      <font-awesome-icon icon="spinner" v-if="loading"></font-awesome-icon>
    </div>
    <div>
      <b-list-group>
        <b-list-group-item v-for="group in groups" :key="group.id">
          <div class="d-flex justify-content-between">
            {{group.code}} - {{group.description}}
            <b-link v-if="canManage" :to="`/groups/${group.id}/edit`">
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

export default {
  name: 'GroupList',
  props: ['congregationId'],
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
      await this.getGroups({ congId: this.congregationId });
    }
  },
  methods: {
    ...mapActions({
      getGroups: 'group/getGroups',
    }),
  },
  computed: {
    ...mapGetters({
      groups: 'group/groups',
      canManage: 'auth/canManage',
    }),
  },
};
</script>

<style scoped>
</style>
