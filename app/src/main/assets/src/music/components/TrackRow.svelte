<!-- src/music/components/TrackRow.svelte -->
<script>
  import { currentTrack, playing, liked, toggleLike, playTrack, audioLoading } from '../store/music.js';
  
  export let track;
  export let isDark = false;
  export let bgCard = '#242424';
  export let txtPrim = '#ffffff';
  export let txtSec = '#aaaaaa';
  export let rank = null;
</script>

<button class="row" on:click={()=> playTrack(track)}>
  {#if rank !== null}
    <span class="rank" style="color:{txtSec}">{rank}</span>
  {/if}

  <div class="thumb-wrap">
    {#if track.album?.cover_medium}
      <img src={track.album.cover_medium} alt={track.title} class="thumb" loading="lazy" />
    {:else}
      <div class="thumb no-img" style="background:{bgCard}">
        <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:{txtSec};width:18px;height:18px;"></span>
      </div>
    {/if}
    {#if $currentTrack?.id === track.id}
      <div class="active-overlay">
        {#if $audioLoading}
          <div class="mini-spinner"></div>
        {:else if $playing}
          <span class="svg-mask" style="mask-image:url('/icons/svg/pause.svg');-webkit-mask-image:url('/icons/svg/pause.svg');background:#fff;width:14px;height:14px;"></span>
        {:else}
          <span class="svg-mask" style="mask-image:url('/icons/svg/play.svg');-webkit-mask-image:url('/icons/svg/play.svg');background:#fff;width:14px;height:14px;"></span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="info">
    <span class="title" style="color:{$currentTrack?.id===track.id?'#FC3C44':txtPrim}">{track.title}</span>
    <span class="artist" style="color:{txtSec}">{track.artist?.name}</span>
  </div>

  <button class="like-btn" on:click|stopPropagation={() => toggleLike(track.id)}>
    {#if $liked.has(track.id)}
      <span class="svg-mask" style="mask-image:url('/icons/svg/bookmark_filled.svg');-webkit-mask-image:url('/icons/svg/bookmark_filled.svg');background:#FC3C44;width:17px;height:17px;"></span>
    {:else}
      <span class="svg-mask" style="mask-image:url('/icons/svg/bookmark.svg');-webkit-mask-image:url('/icons/svg/bookmark.svg');background:{txtSec};width:17px;height:17px;"></span>
    {/if}
  </button>
</button>

<style>
  .row { display:flex;align-items:center;gap:12px;padding:9px 0;background:transparent;border:none;cursor:pointer;text-align:left;width:100%;transition:opacity .15s; }
  .row:active { opacity:0.6; }
  .rank { font-size:14px;font-weight:700;width:22px;text-align:center;flex-shrink:0; }
  .thumb-wrap { position:relative;flex-shrink:0; }
  .thumb { width:52px;height:52px;border-radius:8px;object-fit:cover;display:block; }
  .no-img { display:flex;align-items:center;justify-content:center; }
  .active-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.5);border-radius:8px;display:flex;align-items:center;justify-content:center; }
  .mini-spinner { width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .info { flex:1;min-width:0; }
  .title { display:block;font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .artist { display:block;font-size:13px;margin-top:2px; }
  .like-btn { width:32px;height:32px;border-radius:50%;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0; }
  .like-btn:active { opacity:0.5; }
  .svg-mask { display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0; }
</style>