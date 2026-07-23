<template>
  <ul class="space-y-1">
    <li v-for="node in nodes" :key="node.id">
      <div v-if="node.type === 'folder'" class="space-y-1">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg border border-ink/20 bg-[#313244]/70 px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-[0.1em] text-ink transition hover:border-ink/40"
          @click="toggleFolder(node.id)"
        >
          <span class="inline-flex h-5 w-5 items-center justify-center rounded border border-ink/20 bg-[#181825] text-[10px]">
            {{ expanded.has(node.id) ? '-' : '+' }}
          </span>
          <span class="truncate">{{ node.name }}</span>
          <span class="ml-auto text-[10px] font-medium text-ink/70">{{ node.reviewed }}/{{ node.total }}</span>
        </button>

        <FileTreeView
          v-if="expanded.has(node.id)"
          :nodes="node.children"
          :selected-file-path="selectedFilePath"
          :expanded="expanded"
          class="ml-4"
          @select-file="emit('select-file', $event)"
          @toggle-folder="toggleFolder"
        />
      </div>

      <button
        v-else
        type="button"
        class="w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition"
        :class="
          node.path === selectedFilePath
            ? 'border-tide/70 bg-[#313244] text-ink'
            : 'border-ink/20 bg-[#313244]/70 text-ink hover:border-ink/40'
        "
        @click="emit('select-file', node.path)"
      >
        <span class="block truncate">{{ node.name }}</span>
        <span class="mt-0.5 block text-xs" :class="node.path === selectedFilePath ? 'text-ink/80' : 'text-ink/60'">
          {{ node.reviewed }}/{{ node.total }} reviewed
        </span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { FileTreeNode } from "./fileTree";

defineProps<{
  nodes: FileTreeNode[];
  selectedFilePath: string;
  expanded: Set<string>;
}>();

const emit = defineEmits<{
  "select-file": [path: string];
  "toggle-folder": [id: string];
}>();

function toggleFolder(id: string) {
  emit("toggle-folder", id);
}
</script>
