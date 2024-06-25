<script>
    import Menu from "./Menu.svelte";
    import Visualizer from "./Visualizer.svelte";
    const Store = require('electron-store');

    const store = new Store();

    var songData = {};
    var config = store.get("config");
    var osuData = {};
    const osuFolder = process.env.OSU_FOLDER || process.env.USERPROFILE + "/AppData/Local/osu!";
    
    (() => {
        const configTemplate = {
            parallax: {
                enabled: true,
                treshold: 10
            },
            rpc: true,
            backgrounds: 0,
            mediaSession: true,
            videoBackground: true,
            autohide: {
                info: 2000,
                volume: 2000
            }
        };

        function checkSettings(value, template) {
            if(value === undefined) return template;
            if(typeof value !== "object") return value;

            var out = {};

            for(var key in template) {
                if(value[key] === undefined || typeof value[key] === "undefined") {
                    out[key] = template[key];
                    continue;
                }
                if(typeof value[key] === "object") out[key] = checkSettings(value[key], template[key]);
                if(typeof value[key] !== "object") out[key] = value[key];
            }

            return out;
        }
        config = checkSettings(config, configTemplate);
    })();

    $: store.set("config", config);
</script>

<main>
    <div class="background">
        <Visualizer bind:songData bind:osuData {config} {osuFolder} />
    </div>
    <div class="menu">
        <Menu bind:song={songData} bind:osuData bind:config {osuFolder} />
    </div>
</main>

<style>
    main {
        position: relative;
        width: 100vw;
        height: 100vh;
    }
    .background {
        position: fixed;
        z-index: 0;
        left: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
    }
    .menu {
        position: absolute;
        z-index: 1;
        left: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
    }
</style>