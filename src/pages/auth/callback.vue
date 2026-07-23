<template>
  <section class="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-14 sm:px-8">
    <div class="w-full rounded-[2rem] border border-ink/10 bg-white/90 p-8 shadow-pane backdrop-blur sm:p-10">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">GitHub OAuth</p>
      <h1 class="mt-3 text-3xl font-bold">Authorizing...</h1>
      <p class="mt-3 text-sm text-ink/70">Finishing OAuth callback and preparing your review workspace.</p>
      <p v-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useAuthUi } from "../../composables/useAuthUi";

const { finishOAuthFromCurrentLocation } = useAuthUi();
const errorMessage = ref("");

onMounted(async () => {
  try {
    await finishOAuthFromCurrentLocation();
    await navigateTo("/");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "OAuth callback failed";
  }
});
</script>
