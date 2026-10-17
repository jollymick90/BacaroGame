<script lang="ts">
  import { onMount } from 'svelte';
  import { changeSuperadmin, listSuperadmins } from '$lib/api';
  import type { SuperadminAccount } from '$lib/types';

  let { onroleschange }: { onroleschange: () => Promise<void> } = $props();
  let accounts = $state<SuperadminAccount[]>([]);
  let busy = $state(false);
  let ready = $state(false);
  let error = $state('');
  let notice = $state('');

  async function refresh() {
    busy = true;
    error = '';
    try {
      accounts = (await listSuperadmins()).accounts;
      ready = true;
    } catch (failure) {
      error = failure instanceof Error ? failure.message : 'Impossibile caricare i ruoli.';
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    void refresh();
  });

  async function changeRole(account: SuperadminAccount) {
    const enabled = !account.superadmin && !account.delegated;
    const action = enabled ? 'Nominare superadmin' : 'Revocare il ruolo superadmin a';
    if (!confirm(`${action} ${account.email}?`)) {
      return;
    }
    busy = true;
    error = '';
    notice = '';
    try {
      await changeSuperadmin(account.email, enabled);
      await onroleschange();
      await refresh();
      notice = 'Ruolo aggiornato.';
    } catch (failure) {
      error = failure instanceof Error ? failure.message : 'Impossibile aggiornare il ruolo.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="panel" aria-labelledby="superadmins-title" aria-busy={busy}>
  <h2 id="superadmins-title">Gestione superadmin</h2>
  <p class="hint">
    I superadmin possono registrare altre persone, eliminare le registrazioni e gestire questi ruoli.
    Gli account permanenti sono definiti nella configurazione del server e non possono essere declassati qui.
  </p>
  <button class="secondary" disabled={busy} onclick={refresh}>Aggiorna ruoli</button>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div role="status">
    {#if busy}<p>Caricamento…</p>{/if}
    {#if notice}<p class="notice">{notice}</p>{/if}
  </div>
  {#if ready}
    <ul class="accounts">
      {#each accounts as account (account.email)}
        <li>
          <div>
            <strong>{account.email}</strong>
            <span>
              {#if account.permanent}
                Superadmin permanente
              {:else if !account.eligible}
                Accesso rimosso dalla lista autorizzata
              {:else if account.superadmin}
                Superadmin
              {:else}
                Membro
              {/if}
            </span>
          </div>
          {#if !account.permanent && (account.eligible || account.delegated)}
            <button
              class="secondary"
              disabled={busy}
              onclick={() => changeRole(account)}
              aria-label={`${account.superadmin || account.delegated ? 'Revoca superadmin a' : 'Nomina superadmin'} ${account.email}`}
            >
              {account.superadmin || account.delegated ? 'Revoca superadmin' : 'Nomina superadmin'}
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .accounts {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #bbc8b1;
  }
  li div {
    display: grid;
    gap: 6px;
    overflow-wrap: anywhere;
  }
  li span {
    font-size: 14px;
  }
</style>
