<template>
  <RecycleScroller
    :items="items"
    :item-size="84"
    key-field="patchId"
    class="h-[70vh] overflow-hidden rounded-[1.4rem] border border-ink/20 bg-mist/90 shadow-soft backdrop-blur"
  >
    <template #default="{ item }">
      <article class="border-b border-ink/20 bg-[#181825] p-4" :data-patch-id="item.patchId">
        <header class="mb-2 flex items-start justify-between gap-3">
          <strong class="truncate text-sm font-semibold text-ink">{{ item.filePath }}</strong>
          <code class="max-w-[48%] truncate rounded-md border border-ink/10 bg-mist/80 px-2 py-1 text-[11px] text-ink/65">{{ item.patchId }}</code>
        </header>
        <pre
          v-for="(line, index) in item.lines"
          :key="`${item.patchId}-${index}`"
          class="mb-1 overflow-x-auto rounded-md border-l-2 border-ink/10 bg-mist/60 px-3 py-1.5 font-mono text-[12px] leading-relaxed text-ink/90"
        >{{ line.content }}</pre>
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
