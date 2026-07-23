<template>
  <RecycleScroller
    :items="items"
    :item-size="84"
    key-field="patchId"
    class="virtual-diff-list"
  >
    <template #default="{ item }">
      <article class="hunk-item" :data-patch-id="item.patchId">
        <header class="hunk-header">
          <strong>{{ item.filePath }}</strong>
          <code>{{ item.patchId }}</code>
        </header>
        <pre v-for="(line, index) in item.lines" :key="`${item.patchId}-${index}`">{{ line.content }}</pre>
      </article>
    </template>
  </RecycleScroller>
</template>

<script setup lang="ts">
import { RecycleScroller } from "vue-virtual-scroller";

import type { FlatReviewHunk } from "../composables/reviewPageModel";

defineProps<{
  items: FlatReviewHunk[];
}>();
</script>

<style scoped>
.virtual-diff-list {
  height: 70vh;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.hunk-item {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.hunk-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

pre {
  margin: 0;
  font-size: 12px;
}
</style>
