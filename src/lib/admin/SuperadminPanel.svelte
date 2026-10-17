<script lang="ts">
  import { onMount } from 'svelte';
  import { changeMemberAccess, changeSuperadmin, listSuperadmins } from '$lib/api';
  import type { SuperadminAccount } from '$lib/types';

  interface Props {
    currentEmail: string;
    onroleschange: () => Promise<void>;
  }

  let { currentEmail, onroleschange }: Props = $props();
  let accounts = $state<SuperadminAccount[]>([]);
  let busy = $state(false);
  let ready = $state(false);
  let error = $state('');
  let notice = $state('');
  let newEmail = $state('');

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

  async function updateAccess(email: string, enabled: boolean) {
    busy = true;
    error = '';
    notice = '';
    try {
      await changeMemberAccess(email, enabled);
      newEmail = '';
      if (!enabled && email.toLowerCase() === currentEmail.toLowerCase()) {
        window.location.assign('/admin');
        return;
      }
      await refresh();
      if (enabled) {
        notice = 'Accesso autorizzato. Il membro può accedere con Google.';
      } else {
        notice = 'Accesso e ruolo delegato rimossi.';
      }
    } catch (failure) {
      error = failure instanceof Error ? failure.message : 'Impossibile aggiornare l’accesso.';
    } finally {
      busy = false;
    }
  }

  async function addMember(event: SubmitEvent) {
    event.preventDefault();
    if (busy || !newEmail.trim()) {
      return;
    }
    await updateAccess(newEmail.trim(), true);
  }

  async function removeAccess(account: SuperadminAccount) {
    const confirmed = confirm(
      `Rimuovere l’accesso di ${account.email}? ` +
      'Verrà revocato anche l’eventuale ruolo superadmin. Le registrazioni resteranno nel gioco.',
    );
    if (!confirmed || busy) {
      return;
    }
    await updateAccess(account.email, false);
  }

</script>

<section class="panel" aria-labelledby="superadmins-title" aria-busy={busy}>
  <h2 id="superadmins-title">Membri autorizzati e superadmin</h2>
  <p class="hint">
    I superadmin possono registrare altre persone, eliminare le registrazioni e gestire questi ruoli.
    Gli account permanenti sono definiti nella configurazione del server e non possono essere declassati qui.
  </p>
  <form onsubmit={addMember}>
    <label for="authorized-email">Email Google del membro da autorizzare</label>
    <div class="add-member">
      <input
        id="authorized-email"
        type="email"
        bind:value={newEmail}
        maxlength="254"
        autocomplete="off"
        placeholder="nome@example.com"
        disabled={busy}
        required
      />
      <button class="primary" type="submit" disabled={busy || !newEmail.trim()}>Autorizza membro</button>
    </div>
    <p class="hint">L’accesso permette di registrare se stessi. Il ruolo superadmin si assegna separatamente.</p>
  </form>
  <button class="secondary" disabled={busy} onclick={refresh}>Aggiorna elenco</button>
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
                Accesso non autorizzato
              {:else if account.superadmin}
                Superadmin
              {:else}
                Membro
              {/if}
            </span>
          </div>
          <div class="account-actions">
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
            {#if !account.permanent}
              {#if account.eligible}
                <button
                  class="text-button danger"
                  disabled={busy}
                  onclick={() => removeAccess(account)}
                  aria-label={`Rimuovi accesso a ${account.email}`}
                >Rimuovi accesso</button>
              {:else}
                <button
                  class="secondary"
                  disabled={busy}
                  onclick={() => updateAccess(account.email, true)}
                  aria-label={`Autorizza accesso a ${account.email}`}
                >Autorizza accesso</button>
              {/if}
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .add-member,
  .account-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .add-member input {
    flex: 1 1 240px;
    min-width: 0;
  }
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
  li > div:first-child {
    display: grid;
    gap: 6px;
    overflow-wrap: anywhere;
  }
  li span {
    font-size: 14px;
  }
</style>
