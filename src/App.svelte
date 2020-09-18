<script>
    import Menu from "./Menu.svelte";
    import Visualizer from "./Visualizer.svelte";

    var songData = {};

    var osuData = {};
</script>

<main>
    <div class="background">
        <Visualizer bind:songData bind:osuData/>
    </div>
    <div class="menu">
        <Menu bind:song={songData} bind:osuData/>
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