<template>
  <b-dropdown
    class="selected-group col-sm-12 col-md-3 text-left h-100 alert p-sm-0 px-0 mb-0"
    :text="`Service Group: ${selectedGroup || ''}`">
    <b-dropdown-item
      v-for="group in groupCodes"
      :key="group"
      :to="{ name: 'group', params: { groupCode: group } }"
      class="w-100 mx-0 pl-2">
      <font-awesome-icon class="ml-n4" icon="check" v-if="group === selectedGroup" /> {{group}}
    </b-dropdown-item>
  </b-dropdown>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'GroupsSelect',
  props: ['selectedGroup'],
  computed: {
    ...mapGetters({
      groups: 'auth/groupCodes',
    }),
    groupCodes() {
      return ['ALL', ...this.groups];
    },
  },
};
</script>
