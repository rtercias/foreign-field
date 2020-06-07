<template>
  <div class="tag-container">
    <b-button-group class="flex-wrap" size="sm">
      <div>
        <b-button
        class="mr-1 mb-1"
        size='sm'
        v-for="(tag, index) in tags"
        :key="index"
        :pressed.sync="tag.state"
        v-on:click="passTags"
        variant="outline-primary"
        >
          {{ tag.caption }}
          {{ address.notes }}
        </b-button>
      </div>
    </b-button-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formText: '',
      tags: [
        { caption: 'daysleeper', state: true },
        { caption: 'spouse speaks Tagalog', state: false },
        { caption: '🍔', state: false },
        { caption: 'cheeseburger', state: false },
      ],
    };
  },

  name: 'Address',
  props: ['address'],
  methods: {
    /* eslint-disable */
    passTags(event){
      this.tags.map(tag => this.$emit('tagFromChild', tag));
    }
    /* eslint-enable */
  },
};
</script>

<style>
  .bottom-tags {
    text-align: left;
    color: #17a2b8;
  }
</style>
