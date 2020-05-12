<template>
  <div class="interaction pr-4">
    <span v-for="(item, index) in list" :key="index">
      <span class="pl-0" v-if="item.type === 'button' && (value === item.value || value === undefined)">
        <b-button
          class="p-0"
          variant="link"
          @click="click(value)"
          :disabled="loading">
          {{ item.text }}
        </b-button>
      </span>
      <span class="pl-0" v-else-if="item.type === 'fa-icon' && value === item.value">
        <font-awesome-layers
          :class="item.class"
          @click="click(next || value)">
          <font-awesome-icon :icon="item.icon" v-if="!!item.icon"></font-awesome-icon>
          <font-awesome-layers-text
            :value="item.text"
            class="nh-text text-white font-weight-bold">
          </font-awesome-layers-text>
        </font-awesome-layers>
      </span>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import debounce from 'lodash/debounce';

export default {
  name: 'ActivityButton',
  props: [
    'value',
    'next',
    'displayOnly',
  ],
  data() {
    return {
      list: [
        {
          type: 'fa-icon', value: 'START', text: '', icon: '', class: 'text-success', next: 'NH',
        },
        {
          type: 'fa-icon', value: 'NH', text: 'NH', icon: 'circle', class: 'text-warning', next: 'HOME',
        },
        {
          type: 'fa-icon', value: 'HOME', text: '', icon: 'house-user', class: 'text-success', next: 'PH',
        },
        {
          type: 'fa-icon', value: 'PH', text: '', icon: 'phone', class: 'text-tomato', next: 'LW',
        },
        {
          type: 'fa-icon', value: 'LW', text: '', icon: 'envelope', class: 'text-slate-blue', next: 'NF',
        },
        {
          type: 'fa-icon', value: 'NF', text: 'NF', icon: 'circle', class: 'text-danger', next: 'START',
        },
      ],
    };
  },
  methods: {
    ...mapActions({
      addLog: 'address/addLog',
    }),

    click: debounce(async function (value) {
      if (this.displayOnly) {
        this.$emit('display-click', value);
      } else {
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

.interaction {
  cursor: pointer;
  overflow: hidden;
}

@media print {
  .interaction {
    display: none;
  }
}
</style>
