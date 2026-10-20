<script lang="ts">
  import Bacarodex from '$lib/games/bacarodex/Bacarodex.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Bacarodex configured={data.configuration.configured} />
