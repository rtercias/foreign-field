<template>
  <b-dropdown
    class="selected-group text-left h-100 p-sm-0 p-0 mb-0 w-100"
    :text="`${isDesktop ? 'Group: ' : ''}${truncate(selectedGroup.code, { length: maxChars }) || ''}`">
    <b-dropdown-item
      v-for="group in groupsList"
      :key="group.id"
      :to="{ name: 'group', params: { groupId: group.id } }"
      class="mx-0 pl-2 w-100 d-block"
      @click="selectGroup">
      <font-awesome-icon class="ml-n4" icon="check" v-if="group.id === selectedGroup.id" />
      {{group.code}}
      <span v-if="terrCount(group.id)">{{`(${terrCount(group.id)})`}}</span>
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
    }),
    truncate,
    selectGroup(item) {
      this.getGroup({ id: item });
    },
    terrCount(groupId) {
      const terr = get(this, 'territories');
      if (groupId === 0) {
        return terr.length;
      }
      return terr.filter(t => t.group_id === groupId).length;
    },
  },
  computed: {
    ...mapGetters({
      groups: 'group/groups',
      group: 'group/group',
      territories: 'territories/territories',
      isDesktop: 'auth/isDesktop',
    }),
    groupsList() {
      return [{ id: 0, code: 'ALL' }, ...this.groups];
    },
    selectedGroup() {
      return this.groupsList.find(g => g.id === this.selectedId) || {};
    },
    maxChars() {
      return this.isDesktop ? 19 : 13;
    },
  },
};
</script>
