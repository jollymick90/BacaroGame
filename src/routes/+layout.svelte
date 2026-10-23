<script lang="ts">
  import '../style.css';
  import CommunityFooter from '$lib/game-center/CommunityFooter.svelte';
  let { children } = $props();
</script>
{@render children()}

<CommunityFooter />
