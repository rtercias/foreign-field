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
        variant="outline-primary"
        >
          {{ tag.caption }}
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
        { caption: 'daysleeper', state: false },
        { caption: 'spouse speaks Tagalog', state: false },
        { caption: '🍔', state: false },
        { caption: 'cheeseburger', state: false },
      ],
    };
  },

  methods: {

  },
};
</script>

<style>
  .bottom-tags {
    text-align: left;
    color: #17a2b8;
  }
</style>
