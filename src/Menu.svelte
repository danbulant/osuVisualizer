<script>
    export var osuData;
    export var song;

    var last = Date.now();
    var lastVolumeUpdate = Date.now() - 5000;
    var dialogActive = false;
    var now = Date.now();

    setInterval(() => {
        now = Date.now();
    }, 500);

    var playing = true;

    function resetPool() {
        if(!osuData.songs) return false;
        osuData.songPool = osuData.songs.filter(v => true);
        let a = osuData.songPool;
        for (let i = a.length - 1; i > 0; i--) { // shuffle
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        song = osuData.songPool.shift();
    }

    function playNext() {
        if(song.audio) {
            song.audio.pause();
        }
        if(osuData.songPool.length) {
            song = osuData.songPool.shift();
        } else {
            resetPool();
        }
    }

    $: resetPool(osuData.songs);

    $: console.log(song);

    $: {
        if(song && song.folder && !song.audio) {
            song.audio = new Audio(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + song.folder + "/" + song.audioFile);
            song.audio.play();

            song.audio.onended = () => {
                playNext();
            }
            song.audio.onpause = () => {
                playing = false;
            }
            song.audio.onplay = () => {
                playing = true;
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: song.song,
                    artist: song.artist,
                    album: "Osu! visualizer",
                    artwork: [
                        { src: process.env.USERPROFILE + "/AppData/Local/osu!/Data/bt/" + song.id + ".jpg", type: 'image/jpeg' },
                    ]
                });

                navigator.mediaSession.setActionHandler('play', function() { playing = true; song.audio.play(); });
                navigator.mediaSession.setActionHandler('pause', function() { playing = false; song.audio.pause(); });
                navigator.mediaSession.setActionHandler('nexttrack', function() { playNext()});
            }
        }
    }

    function togglePlay() {
        playing = !playing;
        if(playing) {
            song.audio.play();
        } else {
            song.audio.pause();
        }
    }

    function updateVolume(e) {
        if(!song || !song.audio || !e.altKey) return;
        lastVolumeUpdate = Date.now();
        var volume = song.audio.volume;
        volume += e.deltaY * -0.0005;
        song.audio.volume = Math.min(1, Math.max(volume, 0));
    }

    setTimeout(() => {
        song = song;
    }, 200);
</script>

<svelte:window on:mousemove={() => last = Date.now()} on:wheel={e => updateVolume(e)} />

<div class="menu">
    <div class="info" class:hidden={now - last > 2000}>
        {#if song}
            <div class="song">
                <h2>{song.artist} - {song.song}</h2>
                <div class="controls">
                    <div class="play" on:click={togglePlay}>
                        <img src="images/music_{playing ? "pause" : "play"}.svg" alt="{playing ? "Pause" : "Play"} music" title="{playing ? "Pause" : "Play"} music">
                    </div>
                    <div class="forward" on:click={playNext}>
                        <img src="images/music_forward.svg" alt="Skip the song" title="Skip the song">
                    </div>
                </div>
            </div>
        {/if}
    </div>
    {#if now - lastVolumeUpdate < 4000 && song && song.audio}
        <div class="volume" class:hidden={now - lastVolumeUpdate > 2000}>
            <div class="slider">
                <div class="percent">
                    {Math.round(song.audio.volume * 100)}%
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .info {
        opacity: 1;
        position: relative;
        top: 0;
        left: 0;
        width: 100vw;
        height: 80px;
        transition: opacity 0.6s;
        z-index: 1;
    }

    .volume {
        opacity: 1;
        position: fixed;
        z-index: 2;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        color: black;
        font-size: 30px;
    }

    .hidden {
        opacity: 0;
        transition: opacity 1s;
    }

    .info .song {
        color: white;
        position: absolute;
        padding: 5px 5px 5px 25px;
        top: 0;
        right: 0;
        text-align: right;
        background: black;

        background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.5) 100%);
    }

    .info .song h2 {
        margin: 0;
    }

    .info .controls {
        height: 50px;
        display: flex;
    }
    .info .controls div {
        height: 100%;
    }
    .info .controls img {
        height: 100%;
        filter: invert(100%);
    }
</style>