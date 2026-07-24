<template>
  <ul class="space-y-0.5">
    <li v-for="node in nodes" :key="node.id">
      <div v-if="node.type === 'folder'" class="space-y-1">
        <button
          type="button"
          class="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs text-ink/85 transition hover:bg-[#313244]"
          @click="toggleFolder(node.id)"
        >
          <span
            class="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] text-ink/70"
          >
            {{ expanded.has(node.id) ? "-" : "+" }}
          </span>
          <span class="truncate">{{ node.name }}</span>
          <span class="ml-auto text-[10px] text-ink/55"
            >{{ node.reviewed }}/{{ node.total }}</span
          >
        </button>

        <FileTreeView
          v-if="expanded.has(node.id)"
          :nodes="node.children"
          :selected-file-path="selectedFilePath"
          :expanded="expanded"
          class="ml-3"
          @select-file="emit('select-file', $event)"
          @toggle-folder="toggleFolder"
        />
      </div>

      <button
        v-else
        type="button"
        class="w-full rounded px-2 py-1 text-left text-sm transition"
        :class="
          node.path === selectedFilePath
            ? 'bg-[#313244] text-ink'
            : 'text-ink/85 hover:bg-[#313244]/70'
        "
        @click="emit('select-file', node.path)"
      >
        <span class="block truncate">{{ node.name }}</span>
        <span
          class="block text-[10px]"
          :class="
            node.path === selectedFilePath ? 'text-ink/80' : 'text-ink/60'
          "
        >
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
