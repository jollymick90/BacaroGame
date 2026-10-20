<script lang="ts">
  import GameCenter from '$lib/game-center/GameCenter.svelte';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<GameCenter>{@render children()}</GameCenter>
