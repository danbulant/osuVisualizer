
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Menu.svelte generated by Svelte v3.25.1 */

    const { console: console_1 } = globals;
    const file = "src\\Menu.svelte";

    // (99:8) {#if song}
    function create_if_block_1(ctx) {
    	let div3;
    	let h2;
    	let t0_value = /*song*/ ctx[0].artist + "";
    	let t0;
    	let t1;
    	let t2_value = /*song*/ ctx[0].song + "";
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let img0_alt_value;
    	let img0_title_value;
    	let t4;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div1 = element("div");
    			img1 = element("img");
    			attr_dev(h2, "class", "svelte-1j9fr45");
    			add_location(h2, file, 100, 16, 3079);
    			if (img0.src !== (img0_src_value = "images/music_" + (/*playing*/ ctx[4] ? "pause" : "play") + ".svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", img0_alt_value = "" + ((/*playing*/ ctx[4] ? "Pause" : "Play") + " music"));
    			attr_dev(img0, "title", img0_title_value = "" + ((/*playing*/ ctx[4] ? "Pause" : "Play") + " music"));
    			attr_dev(img0, "class", "svelte-1j9fr45");
    			add_location(img0, file, 103, 24, 3243);
    			attr_dev(div0, "class", "play svelte-1j9fr45");
    			add_location(div0, file, 102, 20, 3177);
    			if (img1.src !== (img1_src_value = "images/music_forward.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Skip the song");
    			attr_dev(img1, "title", "Skip the song");
    			attr_dev(img1, "class", "svelte-1j9fr45");
    			add_location(img1, file, 106, 24, 3501);
    			attr_dev(div1, "class", "forward svelte-1j9fr45");
    			add_location(div1, file, 105, 20, 3434);
    			attr_dev(div2, "class", "controls svelte-1j9fr45");
    			add_location(div2, file, 101, 16, 3133);
    			attr_dev(div3, "class", "song svelte-1j9fr45");
    			add_location(div3, file, 99, 12, 3043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*togglePlay*/ ctx[6], false, false, false),
    					listen_dev(div1, "click", /*playNext*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*song*/ 1 && t0_value !== (t0_value = /*song*/ ctx[0].artist + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*song*/ 1 && t2_value !== (t2_value = /*song*/ ctx[0].song + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*playing*/ 16 && img0.src !== (img0_src_value = "images/music_" + (/*playing*/ ctx[4] ? "pause" : "play") + ".svg")) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*playing*/ 16 && img0_alt_value !== (img0_alt_value = "" + ((/*playing*/ ctx[4] ? "Pause" : "Play") + " music"))) {
    				attr_dev(img0, "alt", img0_alt_value);
    			}

    			if (dirty & /*playing*/ 16 && img0_title_value !== (img0_title_value = "" + ((/*playing*/ ctx[4] ? "Pause" : "Play") + " music"))) {
    				attr_dev(img0, "title", img0_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(99:8) {#if song}",
    		ctx
    	});

    	return block;
    }

    // (113:4) {#if now - lastVolumeUpdate < 4000 && song && song.audio}
    function create_if_block(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0_value = Math.round(/*song*/ ctx[0].audio.volume * 100) + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text("%");
    			attr_dev(div0, "class", "percent");
    			add_location(div0, file, 115, 16, 3868);
    			attr_dev(div1, "class", "slider");
    			add_location(div1, file, 114, 12, 3830);
    			attr_dev(div2, "class", "volume svelte-1j9fr45");
    			toggle_class(div2, "hidden", /*now*/ ctx[3] - /*lastVolumeUpdate*/ ctx[2] > 2000);
    			add_location(div2, file, 113, 8, 3751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*song*/ 1 && t0_value !== (t0_value = Math.round(/*song*/ ctx[0].audio.volume * 100) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*now, lastVolumeUpdate*/ 12) {
    				toggle_class(div2, "hidden", /*now*/ ctx[3] - /*lastVolumeUpdate*/ ctx[2] > 2000);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(113:4) {#if now - lastVolumeUpdate < 4000 && song && song.audio}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let mounted;
    	let dispose;
    	let if_block0 = /*song*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*now*/ ctx[3] - /*lastVolumeUpdate*/ ctx[2] < 4000 && /*song*/ ctx[0] && /*song*/ ctx[0].audio && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "info svelte-1j9fr45");
    			toggle_class(div0, "hidden", /*now*/ ctx[3] - /*last*/ ctx[1] > 2000);
    			add_location(div0, file, 97, 4, 2958);
    			attr_dev(div1, "class", "menu");
    			add_location(div1, file, 96, 0, 2934);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t);
    			if (if_block1) if_block1.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mousemove", /*mousemove_handler*/ ctx[9], false, false, false),
    					listen_dev(window, "wheel", /*wheel_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*song*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*now, last*/ 10) {
    				toggle_class(div0, "hidden", /*now*/ ctx[3] - /*last*/ ctx[1] > 2000);
    			}

    			if (/*now*/ ctx[3] - /*lastVolumeUpdate*/ ctx[2] < 4000 && /*song*/ ctx[0] && /*song*/ ctx[0].audio) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	var { osuData } = $$props;
    	var { song } = $$props;
    	var last = Date.now();
    	var lastVolumeUpdate = Date.now() - 5000;
    	var dialogActive = false;
    	var now = Date.now();

    	setInterval(
    		() => {
    			$$invalidate(3, now = Date.now());
    		},
    		500
    	);

    	var playing = true;

    	function resetPool() {
    		if (!osuData.songs) return false;
    		$$invalidate(8, osuData.songPool = osuData.songs.filter(v => true), osuData);
    		let a = osuData.songPool;

    		for (let i = a.length - 1; i > 0; i--) {
    			// shuffle
    			const j = Math.floor(Math.random() * (i + 1));

    			[a[i], a[j]] = [a[j], a[i]];
    		}

    		$$invalidate(0, song = osuData.songPool.shift());
    	}

    	function playNext() {
    		if (song.audio) {
    			song.audio.pause();
    		}

    		if (osuData.songPool.length) {
    			$$invalidate(0, song = osuData.songPool.shift());
    		} else {
    			resetPool();
    		}
    	}

    	function togglePlay() {
    		$$invalidate(4, playing = !playing);

    		if (playing) {
    			song.audio.play();
    		} else {
    			song.audio.pause();
    		}
    	}

    	function updateVolume(e) {
    		if (!song || !song.audio || !e.altKey) return;
    		$$invalidate(2, lastVolumeUpdate = Date.now());
    		var volume = song.audio.volume;
    		volume += e.deltaY * -0.0005;
    		$$invalidate(0, song.audio.volume = Math.min(1, Math.max(volume, 0)), song);
    	}

    	setTimeout(
    		() => {
    			$$invalidate(0, song);
    		},
    		200
    	);

    	const writable_props = ["osuData", "song"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = () => $$invalidate(1, last = Date.now());
    	const wheel_handler = e => updateVolume(e);

    	$$self.$$set = $$props => {
    		if ("osuData" in $$props) $$invalidate(8, osuData = $$props.osuData);
    		if ("song" in $$props) $$invalidate(0, song = $$props.song);
    	};

    	$$self.$capture_state = () => ({
    		osuData,
    		song,
    		last,
    		lastVolumeUpdate,
    		dialogActive,
    		now,
    		playing,
    		resetPool,
    		playNext,
    		togglePlay,
    		updateVolume
    	});

    	$$self.$inject_state = $$props => {
    		if ("osuData" in $$props) $$invalidate(8, osuData = $$props.osuData);
    		if ("song" in $$props) $$invalidate(0, song = $$props.song);
    		if ("last" in $$props) $$invalidate(1, last = $$props.last);
    		if ("lastVolumeUpdate" in $$props) $$invalidate(2, lastVolumeUpdate = $$props.lastVolumeUpdate);
    		if ("dialogActive" in $$props) dialogActive = $$props.dialogActive;
    		if ("now" in $$props) $$invalidate(3, now = $$props.now);
    		if ("playing" in $$props) $$invalidate(4, playing = $$props.playing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*osuData*/ 256) {
    			 resetPool(osuData.songs);
    		}

    		if ($$self.$$.dirty & /*song*/ 1) {
    			 {
    				if (song && song.folder && !song.audio) {
    					$$invalidate(0, song.audio = new Audio(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + song.folder + "/" + song.audioFile), song);
    					song.audio.play();

    					$$invalidate(
    						0,
    						song.audio.onended = () => {
    							playNext();
    						},
    						song
    					);

    					$$invalidate(
    						0,
    						song.audio.onpause = () => {
    							$$invalidate(4, playing = false);
    						},
    						song
    					);

    					$$invalidate(
    						0,
    						song.audio.onplay = () => {
    							$$invalidate(4, playing = true);
    						},
    						song
    					);

    					if ("mediaSession" in navigator) {
    						navigator.mediaSession.metadata = new MediaMetadata({
    								title: song.song,
    								artist: song.artist,
    								album: "Osu! visualizer",
    								artwork: [
    									{
    										src: process.env.USERPROFILE + "/AppData/Local/osu!/Data/bt/" + song.id + ".jpg",
    										type: "image/jpeg"
    									}
    								]
    							});

    						navigator.mediaSession.setActionHandler("play", function () {
    							$$invalidate(4, playing = true);
    							song.audio.play();
    						});

    						navigator.mediaSession.setActionHandler("pause", function () {
    							$$invalidate(4, playing = false);
    							song.audio.pause();
    						});

    						navigator.mediaSession.setActionHandler("nexttrack", function () {
    							playNext();
    						});
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*song*/ 1) {
    			 console.log(song);
    		}
    	};

    	return [
    		song,
    		last,
    		lastVolumeUpdate,
    		now,
    		playing,
    		playNext,
    		togglePlay,
    		updateVolume,
    		osuData,
    		mousemove_handler,
    		wheel_handler
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { osuData: 8, song: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*osuData*/ ctx[8] === undefined && !("osuData" in props)) {
    			console_1.warn("<Menu> was created without expected prop 'osuData'");
    		}

    		if (/*song*/ ctx[0] === undefined && !("song" in props)) {
    			console_1.warn("<Menu> was created without expected prop 'song'");
    		}
    	}

    	get osuData() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set osuData(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get song() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set song(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Visualizer.svelte generated by Svelte v3.25.1 */

    const { console: console_1$1, window: window_1 } = globals;
    const file$1 = "src\\Visualizer.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			if (img0.src !== (img0_src_value = "images/logo.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "logo svelte-yh70k3");
    			set_style(img0, "animation-duration", /*animDuration*/ ctx[3] + "ms");
    			add_location(img0, file$1, 108, 4, 3650);
    			if (img1.src !== (img1_src_value = "images/logo.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "shadow svelte-yh70k3");
    			set_style(img1, "animation-duration", /*animDuration*/ ctx[3] * 2 + "ms");
    			add_location(img1, file$1, 109, 4, 3753);
    			attr_dev(div, "class", "main svelte-yh70k3");
    			set_style(div, "background-image", "url('" + process.env.USERPROFILE.replace(/\\/g, "/") + "/AppData/Local/osu!/Data/bg/" + /*wallpaper*/ ctx[0] + "')");

    			set_style(div, "background-size", !/*isWidthSmaller*/ ctx[2]
    			? `calc(100% + ${parallaxTreshold * 1.5}px) auto`
    			: `auto calc(100% + ${parallaxTreshold * 1.5}px)`);

    			set_style(div, "background-position", /*mouse*/ ctx[1].x + "px " + /*mouse*/ ctx[1].y + "px");
    			add_location(div, file$1, 100, 0, 3279);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img0);
    			append_dev(div, t);
    			append_dev(div, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mousemove", /*updateMouse*/ ctx[4], false, false, false),
    					listen_dev(window_1, "resize", /*resize*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*animDuration*/ 8) {
    				set_style(img0, "animation-duration", /*animDuration*/ ctx[3] + "ms");
    			}

    			if (dirty & /*animDuration*/ 8) {
    				set_style(img1, "animation-duration", /*animDuration*/ ctx[3] * 2 + "ms");
    			}

    			if (dirty & /*wallpaper*/ 1) {
    				set_style(div, "background-image", "url('" + process.env.USERPROFILE.replace(/\\/g, "/") + "/AppData/Local/osu!/Data/bg/" + /*wallpaper*/ ctx[0] + "')");
    			}

    			if (dirty & /*isWidthSmaller*/ 4) {
    				set_style(div, "background-size", !/*isWidthSmaller*/ ctx[2]
    				? `calc(100% + ${parallaxTreshold * 1.5}px) auto`
    				: `auto calc(100% + ${parallaxTreshold * 1.5}px)`);
    			}

    			if (dirty & /*mouse*/ 2) {
    				set_style(div, "background-position", /*mouse*/ ctx[1].x + "px " + /*mouse*/ ctx[1].y + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const parallaxTreshold = 10;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Visualizer", slots, []);
    	const fs = require("fs");
    	const OsuDBParser = require("osu-db-parser");
    	const osuParser = require("osu-parser");
    	var { osuData } = $$props;
    	var { songData } = $$props;
    	var wallpapers = [];

    	try {
    		wallpapers = fs.readdirSync(process.env.USERPROFILE + "/AppData/Local/osu!/Data/bg");
    	} catch(e) {
    		console.error("Osu backgrounds weren't found. You must have osu installed and started at least once.", e);
    		alert("Osu backgrounds not found!");
    	}

    	try {
    		osuData = new OsuDBParser(Buffer.from(fs.readFileSync(process.env.USERPROFILE + "/AppData/Local/osu!/osu!.db"))).getOsuDBData();
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
    		$$invalidate(0, wallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)]);
    	}

    	var lastSong = null;

    	function fetchBeatmap() {
    		let file = fs.readFileSync(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + songData.folder + "/" + songData.dataFile);
    		$$invalidate(7, songData.beatmap = osuParser.parseContent(file), songData);
    	}

    	var mouse = { x: 0.5, y: 0.5 };

    	function updateMouse(e) {
    		$$invalidate(1, mouse = {
    			x: -(e.clientX / window.innerWidth) * parallaxTreshold - parallaxTreshold / 2,
    			y: -(e.clientY / window.innerHeight) * parallaxTreshold - parallaxTreshold / 2
    		});
    	}

    	var isWidthSmaller = false;

    	function resize() {
    		$$invalidate(2, isWidthSmaller = window.innerWidth * 9 < window.innerHeight * 16);
    	}

    	resize();
    	var animDuration = 0;
    	var kiaiTime = false;

    	setInterval(
    		() => {
    			if (!songData) return;
    			if (!songData.beatmap && songData.dataFile) fetchBeatmap();
    			if (!songData.beatmap) return;
    			var tp = null;

    			for (var t of songData.beatmap.timingPoints) {
    				if (t.offset > songData.audio.currentTime * 1000) break;
    				tp = t;
    			}

    			if (!tp) {
    				$$invalidate(3, animDuration = 0);
    				kiaiTime = false;
    				return;
    			}

    			if (tp.beatLength / 2 !== animDuration) $$invalidate(3, animDuration = tp.beatLength / 2);
    			kiaiTime = tp.kiaiTimeActive;
    		},
    		50
    	);

    	const writable_props = ["osuData", "songData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Visualizer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("osuData" in $$props) $$invalidate(6, osuData = $$props.osuData);
    		if ("songData" in $$props) $$invalidate(7, songData = $$props.songData);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fs,
    		OsuDBParser,
    		osuParser,
    		osuData,
    		songData,
    		wallpapers,
    		wallpaper,
    		shuffleWallpapers,
    		lastSong,
    		fetchBeatmap,
    		mouse,
    		parallaxTreshold,
    		updateMouse,
    		isWidthSmaller,
    		resize,
    		animDuration,
    		kiaiTime
    	});

    	$$self.$inject_state = $$props => {
    		if ("osuData" in $$props) $$invalidate(6, osuData = $$props.osuData);
    		if ("songData" in $$props) $$invalidate(7, songData = $$props.songData);
    		if ("wallpapers" in $$props) wallpapers = $$props.wallpapers;
    		if ("wallpaper" in $$props) $$invalidate(0, wallpaper = $$props.wallpaper);
    		if ("lastSong" in $$props) $$invalidate(9, lastSong = $$props.lastSong);
    		if ("mouse" in $$props) $$invalidate(1, mouse = $$props.mouse);
    		if ("isWidthSmaller" in $$props) $$invalidate(2, isWidthSmaller = $$props.isWidthSmaller);
    		if ("animDuration" in $$props) $$invalidate(3, animDuration = $$props.animDuration);
    		if ("kiaiTime" in $$props) kiaiTime = $$props.kiaiTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*songData, lastSong*/ 640) {
    			 {
    				if (songData !== lastSong) {
    					$$invalidate(9, lastSong = songData);
    					shuffleWallpapers();
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*songData*/ 128) {
    			 if (songData && songData.dataFile && !songData.beatmap) fetchBeatmap();
    		}
    	};

    	return [
    		wallpaper,
    		mouse,
    		isWidthSmaller,
    		animDuration,
    		updateMouse,
    		resize,
    		osuData,
    		songData
    	];
    }

    class Visualizer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { osuData: 6, songData: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Visualizer",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*osuData*/ ctx[6] === undefined && !("osuData" in props)) {
    			console_1$1.warn("<Visualizer> was created without expected prop 'osuData'");
    		}

    		if (/*songData*/ ctx[7] === undefined && !("songData" in props)) {
    			console_1$1.warn("<Visualizer> was created without expected prop 'songData'");
    		}
    	}

    	get osuData() {
    		throw new Error("<Visualizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set osuData(value) {
    		throw new Error("<Visualizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get songData() {
    		throw new Error("<Visualizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set songData(value) {
    		throw new Error("<Visualizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.25.1 */
    const file$2 = "src\\App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div0;
    	let visualizer;
    	let updating_songData;
    	let updating_osuData;
    	let t;
    	let div1;
    	let menu;
    	let updating_song;
    	let updating_osuData_1;
    	let current;

    	function visualizer_songData_binding(value) {
    		/*visualizer_songData_binding*/ ctx[2].call(null, value);
    	}

    	function visualizer_osuData_binding(value) {
    		/*visualizer_osuData_binding*/ ctx[3].call(null, value);
    	}

    	let visualizer_props = {};

    	if (/*songData*/ ctx[0] !== void 0) {
    		visualizer_props.songData = /*songData*/ ctx[0];
    	}

    	if (/*osuData*/ ctx[1] !== void 0) {
    		visualizer_props.osuData = /*osuData*/ ctx[1];
    	}

    	visualizer = new Visualizer({ props: visualizer_props, $$inline: true });
    	binding_callbacks.push(() => bind(visualizer, "songData", visualizer_songData_binding));
    	binding_callbacks.push(() => bind(visualizer, "osuData", visualizer_osuData_binding));

    	function menu_song_binding(value) {
    		/*menu_song_binding*/ ctx[4].call(null, value);
    	}

    	function menu_osuData_binding(value) {
    		/*menu_osuData_binding*/ ctx[5].call(null, value);
    	}

    	let menu_props = {};

    	if (/*songData*/ ctx[0] !== void 0) {
    		menu_props.song = /*songData*/ ctx[0];
    	}

    	if (/*osuData*/ ctx[1] !== void 0) {
    		menu_props.osuData = /*osuData*/ ctx[1];
    	}

    	menu = new Menu({ props: menu_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu, "song", menu_song_binding));
    	binding_callbacks.push(() => bind(menu, "osuData", menu_osuData_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			create_component(visualizer.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(menu.$$.fragment);
    			attr_dev(div0, "class", "background svelte-5atqf");
    			add_location(div0, file$2, 10, 4, 176);
    			attr_dev(div1, "class", "menu svelte-5atqf");
    			add_location(div1, file$2, 13, 4, 268);
    			attr_dev(main, "class", "svelte-5atqf");
    			add_location(main, file$2, 9, 0, 164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			mount_component(visualizer, div0, null);
    			append_dev(main, t);
    			append_dev(main, div1);
    			mount_component(menu, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const visualizer_changes = {};

    			if (!updating_songData && dirty & /*songData*/ 1) {
    				updating_songData = true;
    				visualizer_changes.songData = /*songData*/ ctx[0];
    				add_flush_callback(() => updating_songData = false);
    			}

    			if (!updating_osuData && dirty & /*osuData*/ 2) {
    				updating_osuData = true;
    				visualizer_changes.osuData = /*osuData*/ ctx[1];
    				add_flush_callback(() => updating_osuData = false);
    			}

    			visualizer.$set(visualizer_changes);
    			const menu_changes = {};

    			if (!updating_song && dirty & /*songData*/ 1) {
    				updating_song = true;
    				menu_changes.song = /*songData*/ ctx[0];
    				add_flush_callback(() => updating_song = false);
    			}

    			if (!updating_osuData_1 && dirty & /*osuData*/ 2) {
    				updating_osuData_1 = true;
    				menu_changes.osuData = /*osuData*/ ctx[1];
    				add_flush_callback(() => updating_osuData_1 = false);
    			}

    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(visualizer.$$.fragment, local);
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(visualizer.$$.fragment, local);
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(visualizer);
    			destroy_component(menu);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	var songData = {};
    	var osuData = {};
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function visualizer_songData_binding(value) {
    		songData = value;
    		$$invalidate(0, songData);
    	}

    	function visualizer_osuData_binding(value) {
    		osuData = value;
    		$$invalidate(1, osuData);
    	}

    	function menu_song_binding(value) {
    		songData = value;
    		$$invalidate(0, songData);
    	}

    	function menu_osuData_binding(value) {
    		osuData = value;
    		$$invalidate(1, osuData);
    	}

    	$$self.$capture_state = () => ({ Menu, Visualizer, songData, osuData });

    	$$self.$inject_state = $$props => {
    		if ("songData" in $$props) $$invalidate(0, songData = $$props.songData);
    		if ("osuData" in $$props) $$invalidate(1, osuData = $$props.osuData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		songData,
    		osuData,
    		visualizer_songData_binding,
    		visualizer_osuData_binding,
    		menu_song_binding,
    		menu_osuData_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
