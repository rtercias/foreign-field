<template>
  <div class="d-flex flex-column w-100 py-3">
    <div class="d-flex justify-content-between">
      <span class="title pb-2">Notes</span>
      <b-button-group v-if="isEditing" size="sm" class="badge p-0">
        <b-button variant="primary" class="font-weight-bold">SAVE</b-button>
      </b-button-group>
    </div>
    <textarea class="notes" @click="isEditing=true" @blur="isEditing=false">{{displayedNotes}}</textarea>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import get from 'lodash/get';
import union from 'lodash/union';
import without from 'lodash/without';

export default {
  name: 'Notes',
  props: ['record'],
  data: () => ({
    isEditing: false,
  }),
  computed: {
    ...mapGetters({
      builtInAddressTags: 'congregation/builtInAddressTags',
      builtInPhoneTags: 'congregation/builtInPhoneTags',
      customAddressTags: 'congregation/customAddressTags',
      customPhoneTags: 'congregation/customPhoneTags',
    }),
    displayedNotes() {
      const notesArray = (get(this.record, 'notes') || '').split(',');
      const tags = this.record.type === 'Regular'
        ? union(this.builtInAddressTags, this.customAddressTags)
        : union(this.builtInPhoneTags, this.customPhoneTags);

      return without(notesArray, ...tags).join(',');
    },
  },
};
</script>
<style scoped lang="scss">
  .title {
    text-align: left;
  }
  .notes {
    min-height: 100px;
  }
</style>
