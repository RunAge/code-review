<template>
  <section>
    <h1>Authorizing...</h1>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
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
