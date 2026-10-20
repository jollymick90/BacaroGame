<script lang="ts">
  const upcoming = [
    { name: 'Production Is on Fire', icon: '🔥' },
  ];
</script>

<div class="center-home">
  <header class="center-header"><a class="center-brand" href="#/">BacaroTech<span>Game Center</span></a><a class="open-sign" href="/qr">Mostra QR · Invita a giocare ↗</a></header>
  <main class="center-main">
    <div class="welcome"><h1 tabindex="-1">Una pausa.<br />Quattro modi di perderla bene.</h1><p>Scegli un gioco, passa il telefono, sfida il buon senso.</p></div>
    <div class="playable">
      <article class="game-card hunter-card"><div class="card-art hunter-art" aria-hidden="true"><span>⌁</span><b>BUG<br/>HUNTER</b><span>🐛</span></div><div class="card-copy"><h2>Bug Hunter</h2><p>I bug sono scappati. Corri, salta e riprendili con il retino.</p><a class="play-link" href="#/bug-hunter">Vai a caccia <span aria-hidden="true">↗</span></a></div></article>
      <article class="game-card battle-card">
        <div class="card-art battle-art" aria-hidden="true"><span>⌘</span><b>MERGE<br/>BATTLE!</b><span>∑</span></div>
        <div class="card-copy"><h2>Merge Battle</h2><p>Dev e data science. Due scelte segrete, una review e un merge attack.</p><a class="play-link ai-link" href="#/merge-battle">Sfida un amico o gioca solo <span aria-hidden="true">↗</span></a></div>
      </article>
      <article class="game-card dex-card">
        <div class="card-art dex-art" aria-hidden="true"><span class="friend">☺</span><span class="capture-ball"></span><span class="spark">✦</span></div>
        <div class="card-copy"><h2>Bacarodex</h2><p>Trova un Bacaro. Indovina il Pokémon. Catturalo.</p><a class="play-link" href="#/bacarodex">Gioca a Bacarodex <span aria-hidden="true">↗</span></a></div>
      </article>
      <article class="game-card ai-card">
        <div class="card-art ai-art" aria-hidden="true"><span class="speech">Umano? Vediamo.</span><div class="mini-robot"><i></i><span>••</span><b>▰</b></div><span class="check-sticker">✓</span></div>
        <div class="card-copy"><h2>Are You an AI?</h2><p>Dimostra di essere umano a un robot che non ti crede.</p><a class="play-link ai-link" href="#/are-you-an-ai">Mettimi alla prova <span aria-hidden="true">↗</span></a></div>
      </article>
    </div>
    <section class="coming" aria-labelledby="coming-title"><h2 id="coming-title">Altri guai in preparazione</h2><div class="upcoming-grid">{#each upcoming as game}<article class="upcoming"><span class="concept-icon" aria-hidden="true">{game.icon}</span><h3>{game.name}</h3><span class="soon">In arrivo</span></article>{/each}</div></section>
    <footer class="center-footer"><p>Piccoli prototipi, grandi discussioni al bacaro.</p><a href="/admin">Area membri Bacarodex</a></footer>
  </main>
</div>

<style>
  .center-home{font-family:'Trebuchet MS',ui-sans-serif,system-ui,sans-serif;max-width:1080px;margin:auto;padding:0 28px;color:#193e35}
  .center-header{height:100px;display:flex;justify-content:space-between;gap:16px;align-items:center}.center-brand{text-decoration:none;font-size:23px;font-weight:800;line-height:1.15;letter-spacing:-.7px}.center-brand span{display:block;font-size:14px;letter-spacing:.3px;font-weight:600;margin-top:4px}.open-sign{font-size:13px;border:1px solid #bbc8b1;border-radius:6px;padding:8px 12px;background:#e8ecdd;transform:rotate(2deg)}
  .welcome{padding:46px 0 30px}.welcome h1{font-size:clamp(36px,5.4vw,58px);line-height:1.08;letter-spacing:-2px;margin:0 0 17px;max-width:780px}.welcome p{font-size:17px;color:#58695d;margin:0}
  .hunter-art{background:#9fe5ed;gap:20px;border-bottom:2px solid #193e35}.hunter-art b{font-size:43px;line-height:.85;color:#46328b;letter-spacing:-2px;rotate:-5deg}.hunter-art span{font-size:48px}.battle-card{grid-column:auto}.battle-art{background:#f6cb5e;gap:24px;border-bottom:2px solid #193e35}.battle-art span{font-size:64px;rotate:-12deg}.battle-art b{font-size:48px;line-height:.85;letter-spacing:-3px;color:#6742a6;rotate:-4deg}.playable{display:grid;grid-template-columns:1fr 1fr;gap:24px}.game-card{border:2px solid #193e35;border-radius:20px;overflow:hidden;background:#fffef9}.card-art{height:185px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}.dex-art{background:#d9e5c8;border-bottom:2px solid #193e35;gap:25px}.friend{font-size:130px;line-height:1;transform:rotate(-10deg);color:#193e35}.capture-ball{width:91px;height:91px;border:4px solid #193e35;border-radius:50%;background:linear-gradient(#ec986b 0 45%,#193e35 45% 55%,#fffef9 55%);position:relative;transform:rotate(15deg)}.capture-ball:after{content:'';position:absolute;left:27px;top:27px;width:28px;height:28px;background:#fffef9;border:4px solid #193e35;border-radius:50%}.spark{position:absolute;right:30px;top:13px;font-size:42px}
  .ai-art{background:#e4d9f4;border-bottom:2px solid #193e35;gap:20px}.speech{background:#fffef9;border:2px solid #193e35;padding:10px 14px;border-radius:12px 12px 0 12px;font-size:14px;transform:rotate(-5deg);position:absolute;left:25px;top:24px}.mini-robot{margin:24px 0 0 50px;width:99px;height:94px;border:3px solid #193e35;border-radius:19px;background:#f5cf68;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(6deg);box-shadow:7px 7px 0 #6742a6}.mini-robot i{position:absolute;width:3px;height:16px;background:#193e35;top:-18px}.mini-robot i:after{content:'';width:9px;height:9px;border-radius:50%;background:#193e35;position:absolute;left:-3px;top:-4px}.mini-robot span{font-size:43px;letter-spacing:12px;line-height:.7;margin-left:12px}.mini-robot b{font-size:24px;line-height:1.2}.check-sticker{position:absolute;right:25px;bottom:20px;font-size:28px;background:#fffef9;border:2px solid #193e35;border-radius:50%;width:43px;height:43px;text-align:center;transform:rotate(-15deg)}
  .card-copy{padding:24px}.card-copy h2{font-size:29px;letter-spacing:-.9px;margin:0 0 10px}.card-copy p{font-size:16px;min-height:48px;max-width:32ch;margin:0 0 22px;color:#536559}.play-link{display:flex;justify-content:space-between;align-items:center;gap:15px;min-height:52px;text-decoration:none;font-weight:700;padding:12px 18px;background:#193e35;color:#fffef9;border-radius:10px}.play-link:hover{background:#2e5c4d}.ai-link{background:#6742a6}.ai-link:hover{background:#53328c}
  .coming{margin-top:40px}.coming>h2{font-size:21px;margin-bottom:18px;letter-spacing:-.4px}.upcoming-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.upcoming{padding:18px 16px;border:1px dashed #a7b4a0;border-radius:12px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px 12px;background:#eeeee3}.concept-icon{font-size:27px;grid-row:span 2}.upcoming h3{font-size:16px;margin:0;line-height:1.3}.soon{font-size:12px;color:#536559}.center-footer{padding:30px 0;max-width:none;display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:12px;color:#536559}.center-footer p{margin:0}.center-footer a{min-height:44px;display:flex;align-items:center}
  @media(max-width:650px){.center-home{padding:0 16px}.center-header{height:83px}.center-brand{font-size:20px}.open-sign{font-size:11px;padding:6px 8px}.welcome{padding:30px 0 25px}.welcome h1{font-size:38px;letter-spacing:-1.6px}.welcome p{font-size:15px;max-width:28ch}.playable{grid-template-columns:1fr;gap:20px}.card-art{height:150px}.friend{font-size:110px}.card-copy{padding:20px}.card-copy p{min-height:0}.speech{left:18px;top:16px}.upcoming-grid{grid-template-columns:1fr}.upcoming{padding:14px 16px;grid-template-columns:auto 1fr auto;gap:12px}.concept-icon{grid-row:auto}.coming{margin-top:30px}.center-footer{align-items:flex-start;flex-direction:column;gap:2px}}
</style>
