<template>
  <div class="option-tree">
    <span :style="indent" class="d-inline-block" @click="toggleNodes">
      <span v-if="node.nodes">
        <font-awesome-icon v-if="toggle" icon="minus-square" />
        <font-awesome-icon v-else icon="plus-square" />
      </span>
      <span v-else>
        <font-awesome-icon class="invisible" icon="circle" />
      </span>
      {{node.label}}
    </span>
    <div v-if="node.nodes">
      <div v-if="toggle">
        <option-tree v-for="n in node.nodes" :node="n" :key="n.key" :depth="depth + 1"></option-tree>
      </div>
    </div>
    <span v-else>
      <span v-if="!node.options"></span>
      <b-form-select
        v-else
        :options="node.options" v-model="node.value"
        :style="indent"
        class="w-25 ml-3">
      </b-form-select>
    </span>
  </div>
</template>
<script>
export default {
  name: 'OptionTree',
  props: ['node', 'depth'],
  data() {
    return {
      toggle: false,
    };
  },
  methods: {
    toggleNodes() {
      this.toggle = !this.toggle;
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
