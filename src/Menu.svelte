<script>
    import Options from "./components/options.svelte";

    export var osuData;
    export var song;
    export var config;
    export var osuFolder;

    var last = Date.now();
    var lastVolumeUpdate = Date.now() - 5000;
    var settingsOpen = false;
    var now = Date.now();

    setInterval(() => {
        now = Date.now();
    }, 800);

    function resetPool() {
        if(!osuData.songs) return false;
        osuData.songPool = osuData.songs.filter(v => true);
        let a = osuData.songPool;
        for (let i = a.length - 1; i > 0; i--) { // shuffle
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        osuData.songPool.forEach(v => {
            delete v.audio;
            delete v.video;
            v.playing = true;
        })
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
        (() => {
            if(song && song.folder && !song.audio) {
                // var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                // song.context = audioCtx;
                // song.analyser = audioCtx.createAnalyser();
                song.audio = new Audio(`${osuFolder}/Songs/${song.folder}/${song.audioFile}`);
                // song.source = audioCtx.createMediaElementSource(song.audio);
                // song.source.connect(song.analyser);
                // song.analyser.connect(audioCtx.destination);
                song.audio.play();

                song.audio.onended = () => {
                    playNext();
                }
                song.audio.onpause = () => {
                    song.playing = false;
                    if(song.video) song.video.pause();
                }
                song.audio.onplay = () => {
                    song.playing = true;
                    if(song.video) song.video.play();
                }
                if ('mediaSession' in navigator && config.mediaSession) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: song.song,
                        artist: song.artist,
                        album: "Osu! visualizer",
                        artwork: [
                            { src: `${osuFolder}/Data/bt/${song.id}.jpg`, type: 'image/jpeg' },
                        ]
                    });

                    navigator.mediaSession.setActionHandler('play', function() { song.playing = true; song.audio.play(); });
                    navigator.mediaSession.setActionHandler('pause', function() { song.playing = false; song.audio.pause(); });
                    navigator.mediaSession.setActionHandler('nexttrack', function() { playNext()});
                }
            }
        })();
    }

    $: if(song && song.audio && config.rpc) {
        if(song.playing) {
            window.songActivity = {
                state: "Listening to osu! beatmaps",
                details: `${song.artist} - ${song.song}`,
                startTimestamp: Date.now(),
                endTimestamp: Date.now() + song.audio.duration * 1000,
                instance: false,
                largeImageKey: "logo",
                largeImageText: "Osu!visualizer"
            }
        } else {
            window.songActivity = {
                state: "Paused",
                details: `${song.artist} - ${song.song}`,
                instance: false,
                largeImageKey: "logo",
                largeImageText: "Osu!visualizer"
            }
        }
    }

    function togglePlay() {
        song.playing = !song.playing;
        if(!song.audio) return;
        if(song.playing) {
            song.audio.play();
        } else {
            song.audio.pause();
        }
    }

    var volume = 1;

    function updateVolume(e) {
        if(!song || !song.audio || !e.altKey) return;
        lastVolumeUpdate = Date.now();
        volume += e.deltaY * -0.0005;
        volume = Math.min(1, Math.max(volume, 0));
    }

    $: if(song.audio) song.audio.volume = volume;

    setTimeout(() => {
        playNext();
    }, 200);

    const volumeWidth = 100;
    const volumeStroke = 4;
    const volumeRadius = 50;
</script>

<svelte:window on:mousemove={() => last = Date.now()} on:wheel={e => updateVolume(e)} />

<div class="menu">
    {#if now - last < config.autohide.info + 1000}
        <div class="info" class:hidden={now - last > config.autohide.info}>
            {#if song}
                <div class="song">
                    <h2>{song.artist} - {song.song}</h2>
                    <div class="controls">
                        <div class="play" on:click={togglePlay}>
                            <img src="images/music_{song.playing ? "pause" : "play"}.svg" alt="{song.playing ? "Pause" : "Play"} music" title="{song.playing ? "Pause" : "Play"} music">
                        </div>
                        <div class="forward" on:click={playNext}>
                            <img src="images/music_forward.svg" alt="Skip the song" title="Skip the song">
                        </div>
                        <div class="settings" on:click={() => settingsOpen = !settingsOpen}>
                            <img src="images/settings.svg" alt="Settings" title="Open settings">
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
    {#if now - lastVolumeUpdate < config.autohide.volume + 1000 && song && song.audio}
        <div class="volume" class:hidden={now - lastVolumeUpdate > config.autohide.volume}>
            <div class="slider">
                <div class="percent">
                    {Math.round(song.audio.volume * 100)}%
                </div>
                <svg class="progress-ring" width={volumeWidth} height={volumeWidth}>
                    <circle
                        stroke-width={volumeStroke}
                        fill="transparent"
                        stroke="blue"
                        stroke-dasharray={volumeRadius * 2 * Math.PI + " " + volumeRadius * 2 * Math.PI}
                        stroke-dashoffset={volumeRadius * 2 * Math.PI - song.audio.volume * volumeRadius * 2 * Math.PI}
                        r={volumeRadius - 1}
                        cx={volumeRadius - 1}
                        cy={volumeRadius + 1}
                    />
                </svg>
            </div>
        </div>
    {/if}
    <Options bind:config={config} bind:visible={settingsOpen} {osuFolder} />
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
        z-index: 2;
    }

    .volume {
        opacity: 1;
        position: fixed;
        z-index: 5;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        font-size: 30px;
        color: white;
        background-color: black;
        width: 100px;
        height: 100px;
    }
    .volume .slider {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    .percent {
        position: absolute;
        top: 25px;
        left: 0;
        width: 100%;
        height: 100%;
        text-align: center;
    }
    .progress-ring {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    .progress-ring circle {
        transition: stroke-dashoffset 0.32s;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        position: absolute;
        top: 1px;
        left: 1px;
        width: 100%;
        height: 100%;
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
    .info .controls .settings img {
        height: 65%;
        padding-top: 25%;
    }
</style>