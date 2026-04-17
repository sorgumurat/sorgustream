function playStream(url) {
  const modal = document.getElementById('player-modal');
  const wrapper = document.getElementById('video-content');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  wrapper.innerHTML = '';

  // 1. Durum: Radyo Yayını (Genelde .m3u8 değilse ve radyo sekmesindeysek)
  if (url.includes(':') && !url.includes('.m3u8')) {
    wrapper.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:white;">
        <img src="${defaultRadioLogo}" style="width:150px; margin-bottom:20px; filter: drop-shadow(0 0 15px var(--accent));">
        <h3>Radyo Yayını Oynatılıyor...</h3>
        <audio id="audio-player" controls autoplay style="margin-top:20px; width:80%;">
          <source src="${url}" type="audio/mpeg">
          Tarayıcınız radyo çalmayı desteklemiyor.
        </audio>
      </div>`;
  } 
  // 2. Durum: Canlı TV (.m3u8)
  else if (url.includes('.m3u8')) {
    wrapper.innerHTML = `<video id="video-player" controls style="width:100%; height:100%"></video>`;
    const video = document.getElementById('video-player');
    if (Hls.isSupported()) {
      const hls = new Hls(); hls.loadSource(url); hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    }
  } 
  // 3. Durum: Film/Dizi (Iframe)
  else {
    wrapper.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%; height:100%"></iframe>`;
  }
}
