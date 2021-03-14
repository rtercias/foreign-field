<template>
  <div class="option-tree">
    <div v-if="node.nodes">
      <span
        :style="indent"
        class="d-inline-block"
        :class="{ 'w-100': node.nodes }"
        @click="toggleNodes">
        <span v-if="node.nodes">
          <font-awesome-icon v-if="toggle" icon="minus-square" />
          <font-awesome-icon v-else icon="plus-square" />
        </span>
        <span v-else>
          <font-awesome-icon class="invisible" icon="circle" />
        </span>
        {{node.label}}
      </span>
      <div v-if="toggle">
        <option-tree
          v-for="n in node.nodes"
          :key="n.key"
          :node="n"
          :depth="depth + 1"
          v-on="$listeners"
          :disabled="disabled"
        />
      </div>
    </div>
    <div v-else class="d-flex align-items-center">
      <span :style="indent" class="d-inline-block mr-2">{{node.label}}</span>
      <b-form-select
        v-if="node.options"
        :label="node.label"
        :options="node.options"
        v-model="node.value"
        :style="indent"
        class="w-50"
        :disabled="disabled"
        @change="updateOption">
      </b-form-select>
      <div v-else :style="indent">
        <span v-if="disabled">{{!node.value ? 'None' : node.value}}</span>
        <b-form-input v-else v-model="node.value" @change="updateOption"></b-form-input>
      </div >
    </div>
  </div>
</template>
<script>
export default {
  name: 'OptionTree',
  props: ['node', 'depth', 'disabled'],
  data() {
    return {
      toggle: false,
    };
  },
  methods: {
    toggleNodes() {
      this.toggle = !this.toggle;
    },
    updateOption(value) {
      this.$emit('option-updated', { key: this.node.key, value });
    },
  },
  computed: {
    indent() {
      return { transform: `translate(${this.depth * 25}px)` };
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
