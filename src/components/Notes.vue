<template>
  <div class="d-flex flex-column w-100">
    <span class="title">Notes</span>
    <textarea>{{displayedNotes}}</textarea>
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
</style>
