<script>
	import { createEventDispatcher } from 'svelte';
    const fs = require("fs");
    const OsuDBParser = require("osu-db-parser");
    const osuParser = require("osu-parser");
    export var osuData;
    export var songData;

    var wallpapers = [];
    try {
        wallpapers = fs.readdirSync(process.env.USERPROFILE + "/AppData/Local/osu!/Data/bg");
    } catch(e) {
        console.error("Osu backgrounds weren't found. You must have osu installed and started at least once.", e);
        alert("Osu backgrounds not found!");
    }

    try {
        osuData = (new OsuDBParser(Buffer.from(fs.readFileSync(process.env.USERPROFILE + "/AppData/Local/osu!/osu!.db")))).getOsuDBData();
        console.log(osuData);
        osuData.songs = osuData.beatmaps.map(v => ({
            artist: v.artist_name,
            artist_u: v.artist_name_unicode,
            audioFile: v.audio_file_name,
            folder: v.folder_name,
            song: v.song_title,
            song_u: v.song_title_unicode,
            id: v.beatmapset_id,
            dataFile: `${v.artist_name} - ${v.song_title} (${v.creator_name}) [${v.difficulty}].osu`
        })).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
    } catch(e) {
        console.error("Osu DB weren't found. You must have osu installed and started at least once.", e);
        alert("Osu DB not found!");
    }

    var wallpaper;
    function shuffleWallpapers() {
        wallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];
    }

    var lastSong = null;

    $: {
        if(songData !== lastSong) {
            lastSong = songData;
            shuffleWallpapers();
        }
    }
    function fetchBeatmap() {
        let file = fs.readFileSync(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + songData.folder + "/" + songData.dataFile);
        songData.beatmap = osuParser.parseContent(file);
    }
    $: if(songData && songData.dataFile && !songData.beatmap) fetchBeatmap();

    var mouse = {
        x: 0.5,
        y: 0.5
    };

    const parallaxTreshold = 10;

    function updateMouse(e) {
        mouse = {
            x: -(e.clientX / window.innerWidth) * parallaxTreshold - parallaxTreshold/2,
            y: -(e.clientY / window.innerHeight) * parallaxTreshold - parallaxTreshold/2
        }
    }

    var isWidthSmaller = false;

    function resize() {
        isWidthSmaller = window.innerWidth * 9 < window.innerHeight * 16;
    }
    resize();

    var animDuration = 0;
    var kiaiTime = false;

    setInterval(() => {
        if(!songData) return;
        if(!songData.beatmap && songData.dataFile) fetchBeatmap();
        if(!songData.beatmap) return;

        var tp = null;
        for(var t of songData.beatmap.timingPoints) {
            if(t.offset > songData.audio.currentTime * 1000) break;
            tp = t;
        }
        if(!tp) {
            animDuration = 0;
            kiaiTime = false;
            return;
        }
        if(tp.beatLength/2 !== animDuration)
            animDuration = tp.beatLength/2;
        kiaiTime = tp.kiaiTimeActive;
    }, 50);
</script>

<svelte:window on:mousemove={updateMouse} on:resize={resize} />

<div
    class="main"
    style="
        background-image: url('{process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Data/bg/{wallpaper}');
        background-size: {!isWidthSmaller ? `calc(100% + ${parallaxTreshold * 1.5}px) auto` : `auto calc(100% + ${parallaxTreshold * 1.5}px)`};
        background-position: {mouse.x}px {mouse.y}px;
    "
>
    <img src="images/logo.svg" alt="logo" class="logo" style="animation-duration: {animDuration}ms;">
    <img src="images/logo.svg" alt="" class="shadow" style="animation-duration: {animDuration * 2}ms;">
</div>

<style>
    .main {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-repeat: no-repeat;
    }

    @keyframes bpm {
        from {
            width: 500px;
            height: 500px;
            top: calc(50vh - 250px);
            left: calc(50vw - 250px);
        }
        to {
            width: 525px;
            height: 525px;
            top: calc(50vh - 262.5px);
            left: calc(50vw - 262.5px);
        }
    }

    @keyframes bpmShadow {
        0% {
            width: 500px;
            height: 500px;
            top: calc(50vh - 250px);
            left: calc(50vw - 250px);
        }
        70% {
            width: 510px;
            height: 510px;
            top: calc(50vh - 255px);
            left: calc(50vw - 255px);
        }
        100% {
            width: 500px;
            height: 500px;
            top: calc(50vh - 250px);
            left: calc(50vw - 250px);
        }
    }

    .main img {
        position: fixed;
        width: 500px;
        height: 500px;
        top: calc(50vh - 250px);
        left: calc(50vw - 250px);
    }

    .main .logo {
        animation-name: bpm;
        animation-iteration-count: infinite;
        animation-direction: alternate;
    }

    .main .shadow {
        opacity: 0.2;
        animation-name: bpmShadow;
        animation-iteration-count: infinite;
        animation-delay: 50ms;
    }
</style>