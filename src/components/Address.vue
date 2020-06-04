<template>
  <div>
    <b-row class="pl-2 pr-2 pt-2 bottom-tags align-items-center">
      <b-col cols="12">
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
      </b-col>
    </b-row>
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
        { caption: '🍇', state: false },
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
  .tagsview {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding-left: 0;
  }
</style>
