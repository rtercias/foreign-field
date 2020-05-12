<template>
  <span>
    <span v-for="(item, index) in list" :key="index">
      <span class="pl-0" v-if="item.type === 'button'">
        <b-button
          class="p-0"
          variant="link"
          v-if="value === item.value || value === undefined"
          @click="click(item.next)"
          :disabled="loading">
          {{ item.text || START }}
        </b-button>
      </span>
      <span class="pl-0" v-else-if="item.type === 'fa-icon'">
        <font-awesome-layers
          v-if="value === item.value"
          class="fa-3x"
          :class="item.class"
          @click="click(item.next)">
          <font-awesome-icon :icon="item.icon"></font-awesome-icon>
          <font-awesome-layers-text
            :value="item.text"
            class="nh-text text-white font-weight-bold">
          </font-awesome-layers-text>
        </font-awesome-layers>
      </span>
    </span>
  </span>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

export default {
  name: 'ActivityButton',
  props: [
    'value',
    'displayOnly',
  ],
  data() {
    return {
      list: [
        {
          type: 'button', value: 'START', text: 'START', icon: '', class: '', next: 'HOME',
        },
        {
          type: 'fa-icon', value: 'HOME', text: '', icon: 'check-circle', class: 'text-success', next: 'NH',
        },
        {
          type: 'fa-icon', value: 'NH', text: 'NH', icon: 'circle', class: 'text-warning', next: 'NF',
        },
        {
          type: 'fa-icon', value: 'NF', text: 'NF', icon: 'circle', class: '', next: 'START',
        },
      ],
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),

    click: debounce(async function (value) {
      if (!this.displayOnly) {
        this.$emit('button-click', value);
      }
    }, 500, { leading: true, trailing: false }),
  },
  computed: {
    ...mapGetters({
      loading: 'auth/loading',
    }),
  },
};
</script>
<style>
.nh-text {
  font-size: 0.5em;
}
</style>
