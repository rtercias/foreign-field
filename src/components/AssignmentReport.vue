<template>
  <div>
    <h3 class="text-left font-weight-bold">Territory Assignment Record (S-13)</h3>
    <div class="flex">
      <div class="box-group" v-for="(group, groupIndex) in groupedRecords" :key="groupIndex">
        <div class="text-left font-weight-bold">Terr. No. {{ group[0].territory_name }}</div>
        <div class="" v-for="(record, recordIndex) in group" :key="recordIndex">
          <div class="box box-main flex">
            <div class="box box-1">{{ record.publisher_name }}</div>
            <div class="row-2">
              <div class="box box-2">{{ record.out }}</div>
              <div class="box box-3">{{ record.in }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import assignmentRecords from '@/assignmentRecords.json';
import groupBy from 'lodash/groupBy';

export default {
  data() {
    return {
      groupedRecords: [],
    };
  },

  async mounted() {
    this.groupedRecords = groupBy(assignmentRecords, 'territory_name');
  },
};
</script>

<style scoped>
  .flex {
    display: flex;
    flex-wrap: wrap;
  }
  .box-group {
    margin: 20px 0 70px 0;
  }
  .box-main {
    flex-direction: column;
    border: 1px solid;
    margin: -1px 0 0 -1px;
    width: 220px;
    height: 60px;
  }
  .row-2 {
    display: flex;
  }
  .box-1 {
    border-bottom: 1px solid;
    min-height: 30px;
  }
  .box-2 {
    width: 109px;
    min-height: 28px;
    border-right: 1px solid;
  }
  .box-3 {
    width: 109px;
    min-height: 28px;
  }

  @media print
  {
    .box-group {
      page-break-inside: avoid;
    }
  }
</style>
