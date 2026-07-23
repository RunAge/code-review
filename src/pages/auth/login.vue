<template>
  <section>
    <h1>Sign in to GitHub</h1>
    <p>
      Use OAuth PKCE when backend token exchange is available, or provide a PAT for static deployments
      like GitHub Pages.
    </p>

    <button type="button" @click="onOAuthLogin">Continue with GitHub OAuth</button>

    <form @submit.prevent="onPatSubmit">
      <label for="pat-token">Personal Access Token</label>
      <input id="pat-token" v-model="patToken" type="password" autocomplete="off" />
      <button type="submit">Use PAT</button>
    </form>

    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useAuthUi } from "../../composables/useAuthUi";

const { beginOAuthLogin, setPatToken } = useAuthUi();

const patToken = ref("");
const errorMessage = ref("");

async function onOAuthLogin() {
  errorMessage.value = "";

  try {
    await beginOAuthLogin();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "OAuth login failed";
  }
}

function onPatSubmit() {
  errorMessage.value = "";

  if (!patToken.value.trim()) {
    errorMessage.value = "PAT token is required";
    return;
  }

  setPatToken(patToken.value.trim());
  patToken.value = "";
}
</script>
