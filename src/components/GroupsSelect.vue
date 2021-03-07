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
      <font-awesome-icon class="ml-n4" icon="check" v-if="group.id === selectedGroup.id" /> {{group.code}}
    </b-dropdown-item>
  </b-dropdown>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
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
  },
  computed: {
    ...mapGetters({
      groups: 'group/groups',
      group: 'group/group',
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
