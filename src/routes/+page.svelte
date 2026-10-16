<script lang="ts">
  import GameCenter from '$lib/game-center/GameCenter.svelte';
  let { data } = $props();
</script>
<GameCenter configured={data.configured} />
