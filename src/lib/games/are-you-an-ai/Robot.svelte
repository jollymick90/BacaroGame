<script lang="ts">
  let { interactive = false, onclick }: { interactive?: boolean; onclick?: () => void } = $props();
</script>

{#snippet face()}
  <span class="robot-face" aria-hidden="true"
    ><span class="antenna"></span><span class="eyes"><i></i><i></i></span><span class="mouth"
    ></span></span
  >
{/snippet}
{#if interactive}<button class="robot-button" aria-label="Seleziona il robot assistente" {onclick}
    >{@render face()}<span>Robot assistente</span></button
  >
{:else}<div class="robot-static">{@render face()}<span>Robot assistente</span></div>{/if}

<style>
  .robot-static,
  .robot-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: none;
    padding: 16px 14px 10px;
    min-width: 122px;
    color: #193e35;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    background: none;
    border: 2px solid transparent;
    border-radius: 16px;
    min-height: 0;
  }
  .robot-button {
    cursor: pointer;
  }
  .robot-button:focus-visible {
    outline: 3px solid #6742a6;
    outline-offset: 3px;
  }
  .robot-button:hover:not(:disabled) {
    background: #e4d9f4;
  }
  .robot-face {
    width: 76px;
    height: 66px;
    border: 3px solid #193e35;
    border-radius: 15px;
    background: #f5cf68;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow: 4px 4px 0 #b5a2cf;
  }
  .antenna {
    position: absolute;
    width: 3px;
    height: 12px;
    background: #193e35;
    top: -14px;
  }
  .antenna:after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #193e35;
    left: -2.5px;
    top: -4px;
  }
  .eyes {
    display: flex;
    gap: 21px;
  }
  .eyes i {
    width: 8px;
    height: 10px;
    border-radius: 3px;
    background: #193e35;
  }
  .mouth {
    width: 27px;
    height: 6px;
    border: 2px solid #193e35;
    border-radius: 3px;
  }
  @media (max-width: 420px) {
    .robot-static,
    .robot-button {
      min-width: 104px;
      padding-left: 8px;
      padding-right: 8px;
    }
    .robot-face {
      width: 65px;
      height: 59px;
    }
  }
</style>
