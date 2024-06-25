<script>
    export var config;
    export var visible;
    export var osuFolder;

    $: console.log("Config", config);
</script>

<div class="options">
    <div class="bg" class:visible={visible} on:click={() => visible = false}></div>
    <nav class:visible={visible}>
        <h2>Options</h2>

        <div class="group">
            <h3>Parallax</h3>
            <div class="row">
                <span>Enable parallax</span>
                <input type="checkbox" bind:checked={config.parallax.enabled}>
            </div>
            <div class="row" class:enabled={config.parallax.enabled}>
                <span>Parallax treshold</span>
                <input type="range" min="1" max="30" bind:value={config.parallax.treshold}>
            </div>
        </div>
        <div class="group">
            <h3>Integrations</h3>
            <div class="row">
                <span>Discord Rich Presence</span>
                <input type="checkbox" bind:checked={config.rpc}>
            </div>
            <div class="row">
                <span>MediaSession (system-wide controls)</span>
                <input type="checkbox" bind:checked={config.mediaSession}>
            </div>
        </div>
        <div class="group">
            <h3>Backgrounds</h3>
            <select bind:value={config.backgrounds}>
                <option value={0}>Osu!wallpapers</option>
                <option value={1}>Beatmap wallpapers</option>
            </select>
            <div class="row">
                <span>Video backgrounds</span>
                <input type="checkbox" bind:checked={config.videoBackground}>
            </div>
        </div>
        <div class="group">
            <h3>UI</h3>
            <div class="row">
                <span>Song info hide timeout</span>
                <input type="range" min="1000" max="15000" step="500" bind:value={config.autohide.info}>
            </div>
            <div class="row">
                <span>Volume hide timeout</span>
                <input type="range" min="1000" max="15000" step="500" bind:value={config.autohide.volume}>
            </div>
        </div>
        <span>Osu folder used: <code>{osuFolder}</code></span>
    </nav>
</div>
    
<style>
    .bg {
        position: fixed;
        display: none;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        z-index: 3;
    }
    .bg.visible {
        display: block;
    }
    nav {
        position: fixed;
        height: 100vh;
        width: 400px;
        top: 0;
        left: -400px;
        opacity: 0;
        background: rgba(0,0,0,0.4);
        color: white;
        z-index: 4;
        padding-left: 1rem;
        transition: opacity 0.3s, left 0.3s;
    }
    nav.visible {
        left: 0;
        opacity: 1;
    }
</style>