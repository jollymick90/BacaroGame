<script lang="ts">
  const socials = [
    { name: 'WhatsApp', href: 'https://whatsapp.com/channel/0029Vb62oilIyPtNZRvjI61K', column: 0, row: 0 },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/bacarotech', column: 1, row: 0 },
    { name: 'GitHub', href: 'https://github.com/BacaroTech', column: 2, row: 0 },
    { name: 'TikTok', href: 'https://www.tiktok.com/@bacarotech', column: 3, row: 0 },
    { name: 'Mastodon', href: 'https://mastodon.social/@bacarotech', column: 4, row: 0 },
    { name: 'YouTube', href: 'https://www.youtube.com/@Bacarotech', column: 0, row: 1 },
    { name: 'Instagram', href: 'https://www.instagram.com/bacarotechofficial/', column: 1, row: 1 },
    { name: 'Discord', href: 'https://discord.gg/bnMSXkyy', column: 2, row: 1 },
    { name: 'Bluesky', href: 'https://bsky.app/profile/bacarotech.bsky.social', column: 3, row: 1 },
    { name: 'Email', href: 'mailto:bacarotech@gmail.com', column: 4, row: 1 },
  ];
</script>

<footer class="community-footer" aria-label="Segui BacaroTech">
  <div class="community-copy"><strong>BacaroTech</strong><a class="follow" href="https://bacarotech.github.io/" target="_blank" rel="noopener noreferrer">Clicca qui e seguici</a></div>
  <nav aria-label="Social BacaroTech">
    {#each socials as social}
      <a href={social.href} target="_blank" rel={social.href.startsWith('mailto:') ? 'noopener noreferrer' : 'noopener noreferrer me'}>
        <span class="social-icon" aria-hidden="true" style:--sprite-x={`${-8.5 - social.column * 45}px`} style:--sprite-y={`${-4.5 - social.row * 62.5}px`}></span>
        <span>{social.name}</span>
      </a>
    {/each}
  </nav>
</footer>

<style>
  .community-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; width: 100%; max-width: none; margin-top: 0; padding: 28px max(20px, calc((100vw - 1064px) / 2)); border-top: 1px solid #484857; background: #323258; color: #f6f3ea; font-size: 14px; }
  .community-copy { display: grid; gap: 6px; }
  strong { font-size: 20px; color: #f6f3ea; }
  a { min-height: 44px; display: inline-flex; align-items: center; text-underline-offset: 4px; }
  .follow { color: #00e5a3; font-weight: 800; }
  nav { display: flex; gap: 8px; flex-wrap: wrap; margin: 0; padding: 0; border: 0; }
  nav a { flex-direction: column; justify-content: center; gap: 4px; width: 76px; padding: 8px 4px; border: 1px solid transparent; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 750; }
  .social-icon { display: block; width: 44px; height: 48px; flex-shrink: 0; background-image: url('/images/social-icons.png'); background-repeat: no-repeat; background-size: 234px 123px; background-position: var(--sprite-x) var(--sprite-y); }
  nav a:hover { border-color: #b9a1fb; background: transparent; }
</style>
