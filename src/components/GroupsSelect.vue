<template>
  <b-dropdown
    class="selected-group text-left h-100 p-sm-0 p-0 mb-0 w-100"
    :text="`${isDesktop ? 'Group: ' : ''}${truncate(displayName(selectedGroup), { length: maxChars }) || ''}`">
    <b-dropdown-item
      v-for="group in groupsList"
      :key="group.id"
      :to="{ name: 'group', params: { groupId: group.id } }"
      class="mx-0 pl-2 w-100 d-block"
      @click="selectGroup">
      <font-awesome-icon class="ml-n4" icon="check" v-if="group.id === selectedGroup.id" />
      {{displayName(group)}}
      <span>{{`(${terrCount(group.id)})`}}</span>
    </b-dropdown-item>
  </b-dropdown>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import get from 'lodash/get';
import truncate from 'lodash/truncate';

export default {
  name: 'GroupsSelect',
  props: ['selectedId'],
  methods: {
    ...mapActions({
      getGroup: 'group/getGroup',
      getGroups: 'group/getGroups',
      fetchAllTerritories: 'territories/fetchAllTerritories',
    }),
    truncate,
    selectGroup(item) {
      this.getGroup({ id: item });
    },
    terrCount(groupId) {
      const terr = get(this, 'allTerritories');
      if (groupId === 0) {
        return terr.length;
      }
      return terr.filter(t => t.group_id === groupId).length;
    },
    displayName(group) {
      return this.isDesktop
        && group.id !== 0 ? `${get(group, 'code', '')} - ${get(group, 'description', '')}` : group.code;
    },
    async getGroupsList() {
      if (!this.groups.length) {
        const congId = get(this.user, 'congregation.id');
        await this.getGroups({ congId });
      }
    },
  },
  computed: {
    ...mapGetters({
      user: 'auth/user',
      groups: 'group/groups',
      group: 'group/group',
      territories: 'territories/territories',
      allTerritories: 'territories/allTerritories',
      isDesktop: 'auth/isDesktop',
    }),
    groupsList() {
      return [...this.groups, { id: 0, code: 'ALL' }];
    },
    selectedGroup() {
      return this.groupsList.find(g => g.id === this.selectedId) || {};
    },
    maxChars() {
      return this.isDesktop ? 19 : 13;
    },
  },
  async mounted() {
    if (!this.group) {
      await this.getGroup({ id: this.selectedId });
    }
    await this.getGroupsList();
  },
  watch: {
    async user() {
      await this.getGroupsList();
    },
  },
};
</script>
