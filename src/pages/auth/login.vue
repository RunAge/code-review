<template>
  <section class="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-14 sm:px-8">
    <div class="w-full rounded-[2rem] border border-ink/10 bg-white/90 p-8 shadow-pane backdrop-blur sm:p-10">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">Authentication</p>
      <h1 class="mt-3 text-3xl font-bold sm:text-4xl">Sign in to GitHub</h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
        Use OAuth PKCE when backend token exchange is available, or provide a PAT for static deployments
        like GitHub Pages.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-xl2 bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-ink/90"
          @click="onOAuthLogin"
        >
          Continue with OAuth
        </button>
        <NuxtLink
          to="/review"
          class="rounded-xl2 border border-ink/20 px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-tide/35 hover:text-tide"
        >
          Open Review Page
        </NuxtLink>
      </div>

      <form @submit.prevent="onPatSubmit" class="mt-8 rounded-xl2 border border-ink/10 bg-mist/80 p-5">
        <label for="pat-token" class="block text-xs font-semibold uppercase tracking-[0.14em] text-ink/65">
          Personal Access Token
        </label>
        <input
          id="pat-token"
          v-model="patToken"
          type="password"
          autocomplete="off"
          class="mt-3 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono text-sm text-ink outline-none transition focus:border-flare/60 focus:ring-2 focus:ring-flare/20"
          placeholder="ghp_..."
        />
        <button
          type="submit"
          class="mt-4 rounded-xl bg-flare px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-flare/90"
        >
          Use PAT
        </button>
      </form>

      <p v-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>
    </div>
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
