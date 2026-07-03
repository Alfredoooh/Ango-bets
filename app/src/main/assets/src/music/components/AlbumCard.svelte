<script>
  export let album;
  export let txtPrim = '#ffffff';
  export let txtSec = '#aaaaaa';
  export let bgCard = '#242424';
  export let size = 148;
  export let onClick = () => {};
</script>

<button class="card" style="width:{size}px" on:click={onClick}>
  <div class="img-wrap" style="width:{size}px;height:{size}px">
    {#if album.cover_medium || album.cover_big}
      <img
        src={album.cover_big || album.cover_medium}
        alt={album.title}
        class="img"
        loading="lazy"
      />
    {:else}
      <div class="img no-img" style="background:{bgCard}">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="{txtSec}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </div>
    {/if}
    <div class="disc-hole"></div>
  </div>
  <span class="title" style="color:{txtPrim}">{album.title?.length>18?album.title.slice(0,18)+'…':album.title}</span>
  <span class="artist" style="color:{txtSec}">{album.artist?.name}</span>
</button>

<style>
  .card { background:transparent;border:none;cursor:pointer;text-align:left;padding:0;flex-shrink:0; }
  .card:active { opacity:0.7; }
  .img-wrap { border-radius:50%;overflow:hidden;margin-bottom:8px;position:relative; }
  .img { width:100%;height:100%;object-fit:cover;display:block; }
  .no-img { display:flex;align-items:center;justify-content:center; }
  .disc-hole {
    position:absolute;
    top:50%;left:50%;
    transform:translate(-50%,-50%);
    width:18%;height:18%;
    border-radius:50%;
    background:#0a0a0a;
    box-shadow:0 0 0 2px rgba(255,255,255,0.15) inset;
  }
  .title { display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .artist { display:block;font-size:12px;margin-top:2px; }
</style>