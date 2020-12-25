<template>
  <b-dropdown
    class="selected-group text-left h-100 alert p-sm-0 px-0 mb-0"
    :text="`Service Group: ${truncate(selectedGroup.code, { length: 21 }) || ''}`">
    <b-dropdown-item
      v-for="group in groupsList"
      :key="group.id"
      :to="{ name: 'group', params: { groupId: group.id } }"
      class="w-100 mx-0 pl-2">
      <font-awesome-icon class="ml-n4" icon="check" v-if="group.id === selectedGroup.id" /> {{group.code}}
    </b-dropdown-item>
  </b-dropdown>
</template>
<script>
import { mapGetters } from 'vuex';
import truncate from 'lodash/truncate';

export default {
  name: 'GroupsSelect',
  props: ['selectedId'],
  methods: {
    truncate,
  },
  computed: {
    ...mapGetters({
      groups: 'group/groups',
    }),
    groupsList() {
      return [{ id: 0, code: 'ALL' }, ...this.groups];
    },
    selectedGroup() {
      return this.groupsList.find(g => g.id === this.selectedId) || {};
    },
  },
};
</script>
