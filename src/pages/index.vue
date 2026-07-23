<template>
  <main class="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-10">
    <section class="grid w-full gap-8 rounded-[2rem] border border-ink/20 bg-mist/90 p-8 shadow-pane backdrop-blur sm:p-12 lg:grid-cols-[1.35fr_1fr]">
      <div class="space-y-6 animate-rise">
        <p class="inline-flex rounded-full border border-ink/25 bg-[#313244] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/80">
          Focused code review workspace
        </p>
        <h1 class="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Review pull requests faster with contextual diffs and threaded insight.
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-ink/75 sm:text-lg">
          Parse large diffs, suppress AI noise, and submit structured decisions from a single screen.
        </p>
      </div>

      <nav class="grid gap-4 self-end animate-rise [animation-delay:120ms]">
        <NuxtLink
          to="/auth/login"
          class="group rounded-xl2 border border-ink/20 bg-[#313244] p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-flare/60"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Step 1</p>
          <p class="mt-2 text-xl font-semibold">Connect GitHub</p>
          <p class="mt-2 text-sm text-ink/70">Authenticate with OAuth or paste a PAT token.</p>
        </NuxtLink>

        <NuxtLink
          to="/review"
          class="group rounded-xl2 border border-ink/20 bg-[#11111b] p-5 text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-[#0c0c14]"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink/70">Step 2</p>
          <p class="mt-2 text-xl font-semibold">Open Review</p>
          <p class="mt-2 text-sm text-ink/70">Load owner, repo and PR to start line-by-line review.</p>
        </NuxtLink>
      </nav>
    </section>
  </main>
</template>
