<script lang="ts">
  import BugHunter from '$lib/games/bug-hunter/BugHunter.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<BugHunter questions={data.configuration.bugHunter.questions} />
