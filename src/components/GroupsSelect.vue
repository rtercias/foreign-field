<template>
  <b-dropdown
    class="selected-group text-left h-100 alert p-sm-0 p-0 mb-0"
    :text="`Service Group: ${truncate(selectedGroup.code, { length: 21 }) || ''}`">
    <b-dropdown-item
      v-for="group in groupsList"
      :key="group.id"
      :to="{ name: 'group', params: { groupId: group.id } }"
      class="w-100 mx-0 pl-2"
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
