<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  import { CreditsApiService } from '$shared/api.js';
  import { PLANS_DATA } from '$shared/plans.js';
  
  export let isDark = false;
  export let open = false;
  export let user = null;
  
  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);
  
  let loading = '';
  
  async function handleCheckout(planId) {
    if (!user?.token || loading) return;
    loading = planId;
    try {
      const res = await CreditsApiService.checkout(user.token, planId);
      if (res?.url) window.location.href = res.url;
    } catch (e) {}
    loading = '';
  }
</script>

{#if open}
  <div class="overlay" on:click={() => dispatch('close')}></div>
  <div class="modal" class:dark={isDark} style="background:{c.dialogBackground}">
    <div class="modal-handle"></div>
    <div class="modal-title" style="color:{c.textPrimary}">Escolhe o teu plano</div>
    <div class="plans">
      {#each Object.entries(PLANS_DATA) as [id, plan]}
        <div class="plan-card" style="border-color:{plan.accent}20;background:{isDark?'#2C2C2E':'#F9F9F9'}">
          <div class="plan-header">
            <div class="plan-title" style="color:{c.textPrimary}">{plan.title}</div>
            <div class="plan-badge" style="background:{plan.accent}20;color:{plan.accent}">{plan.badge}</div>
          </div>
          <div class="plan-price" style="color:{plan.accent}">{plan.price}<span style="font-size:13px;color:{c.textSecondary}">/mês</span></div>
          <div class="plan-features">
            {#each plan.features as f}
              <div class="plan-feature" style="color:{c.textSecondary}">
                <span style="color:{plan.accent}">✓</span> {f}
              </div>
            {/each}
          </div>
          <button class="plan-btn" style="background:{plan.accent}" on:click={() => handleCheckout(id)} disabled={!!loading}>
            {loading === id ? '…' : 'Subscrever'}
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.4); }
  .modal {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 401;
    border-radius: 24px 24px 0 0; padding: 0 20px calc(32px + env(safe-area-inset-bottom));
    max-height: 85dvh; overflow-y: auto;
    animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(120,120,128,0.3); margin: 12px auto 16px; }
  .modal-title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 20px; }
  .plans { display: flex; flex-direction: column; gap: 14px; }
  .plan-card { border-radius: 16px; border: 1px solid; padding: 18px; }
  .plan-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .plan-title { font-size: 17px; font-weight: 700; }
  .plan-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
  .plan-price { font-size: 26px; font-weight: 800; margin-bottom: 12px; }
  .plan-features { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .plan-feature { font-size: 13.5px; display: flex; gap: 6px; }
  .plan-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
  .plan-btn:active { opacity: 0.8; }
  .plan-btn:disabled { opacity: 0.5; }
</style>