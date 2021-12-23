<template>
  <div class="mt-5">
    Sorry, you don't have access to this page.
    <div v-if="$route.query.expired">Your session has expired.</div>
  </div>
</template>
