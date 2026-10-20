<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import GameCenterHome from '$lib/game-center/GameCenterHome.svelte';
  import { legacyGamePath } from '$lib/game-center/legacy-route';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  onMount(() => {
    // Fragments never reach the server. Keep already distributed QR codes working.
    const redirect = () => {
      const path = legacyGamePath(window.location.hash);
      if (path) void goto(path + window.location.search, { replaceState: true });
    };
    redirect();
    window.addEventListener('hashchange', redirect);
    return () => window.removeEventListener('hashchange', redirect);
  });
</script>

<svelte:head><title>BacaroTech Game Center</title></svelte:head>
<GameCenterHome configured={data.configuration.configured} />
