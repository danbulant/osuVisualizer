
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    /* src\components\options.svelte generated by Svelte v3.25.1 */

    const { console: console_1 } = globals;
    const file = "src\\components\\options.svelte";

    function create_fragment(ctx) {
    	let div12;
    	let div0;
    	let t0;
    	let nav;
    	let h2;
    	let t2;
    	let div3;
    	let h30;
    	let t4;
    	let div1;
    	let span0;
    	let t6;
    	let input0;
    	let t7;
    	let div2;
    	let span1;
    	let t9;
    	let input1;
    	let t10;
    	let div6;
    	let h31;
    	let t12;
    	let div4;
    	let span2;
    	let t14;
    	let input2;
    	let t15;
    	let div5;
    	let span3;
    	let t17;
    	let input3;
    	let t18;
    	let div8;
    	let h32;
    	let t20;
    	let select;
    	let option0;
    	let option0_value_value;
    	let option1;
    	let option1_value_value;
    	let t23;
    	let div7;
    	let span4;
    	let t25;
    	let input4;
    	let t26;
    	let div11;
    	let h33;
    	let t28;
    	let div9;
    	let span5;
    	let t30;
    	let input5;
    	let t31;
    	let div10;
    	let span6;
    	let t33;
    	let input6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div0 = element("div");
    			t0 = space();
    			nav = element("nav");
    			h2 = element("h2");
    			h2.textContent = "Options";
    			t2 = space();
    			div3 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Parallax";
    			t4 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Enable parallax";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Parallax treshold";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			div6 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Integrations";
    			t12 = space();
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Discord Rich Presence";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			div5 = element("div");
    			span3 = element("span");
    			span3.textContent = "MediaSession (system-wide controls)";
    			t17 = space();
    			input3 = element("input");
    			t18 = space();
    			div8 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Backgrounds";
    			t20 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Osu!wallpapers";
    			option1 = element("option");
    			option1.textContent = "Beatmap wallpapers";
    			t23 = space();
    			div7 = element("div");
    			span4 = element("span");
    			span4.textContent = "Video backgrounds";
    			t25 = space();
    			input4 = element("input");
    			t26 = space();
    			div11 = element("div");
    			h33 = element("h3");
    			h33.textContent = "UI";
    			t28 = space();
    			div9 = element("div");
    			span5 = element("span");
    			span5.textContent = "Song info hide timeout";
    			t30 = space();
    			input5 = element("input");
    			t31 = space();
    			div10 = element("div");
    			span6 = element("span");
    			span6.textContent = "Volume hide timeout";
    			t33 = space();
    			input6 = element("input");
    			attr_dev(div0, "class", "bg svelte-1895ym0");
    			toggle_class(div0, "visible", /*visible*/ ctx[1]);
    			add_location(div0, file, 8, 4, 140);
    			add_location(h2, file, 10, 8, 264);
    			add_location(h30, file, 13, 12, 325);
    			add_location(span0, file, 15, 16, 391);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 16, 16, 437);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 14, 12, 356);
    			add_location(span1, file, 19, 16, 608);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "30");
    			add_location(input1, file, 20, 16, 656);
    			attr_dev(div2, "class", "row");
    			toggle_class(div2, "enabled", /*config*/ ctx[0].parallax.enabled);
    			add_location(div2, file, 18, 12, 533);
    			attr_dev(div3, "class", "group");
    			add_location(div3, file, 12, 8, 292);
    			add_location(h31, file, 24, 12, 810);
    			add_location(span2, file, 26, 16, 880);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file, 27, 16, 932);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 25, 12, 845);
    			add_location(span3, file, 30, 16, 1050);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file, 31, 16, 1116);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file, 29, 12, 1015);
    			attr_dev(div6, "class", "group");
    			add_location(div6, file, 23, 8, 777);
    			add_location(h32, file, 35, 12, 1253);
    			option0.__value = option0_value_value = 0;
    			option0.value = option0.__value;
    			add_location(option0, file, 37, 16, 1345);
    			option1.__value = option1_value_value = 1;
    			option1.value = option1.__value;
    			add_location(option1, file, 38, 16, 1404);
    			if (/*config*/ ctx[0].backgrounds === void 0) add_render_callback(() => /*select_change_handler*/ ctx[7].call(select));
    			add_location(select, file, 36, 12, 1287);
    			add_location(span4, file, 41, 16, 1521);
    			attr_dev(input4, "type", "checkbox");
    			add_location(input4, file, 42, 16, 1569);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file, 40, 12, 1486);
    			attr_dev(div8, "class", "group");
    			add_location(div8, file, 34, 8, 1220);
    			add_location(h33, file, 46, 12, 1709);
    			add_location(span5, file, 48, 16, 1769);
    			attr_dev(input5, "type", "range");
    			attr_dev(input5, "min", "1000");
    			attr_dev(input5, "max", "15000");
    			attr_dev(input5, "step", "500");
    			add_location(input5, file, 49, 16, 1822);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file, 47, 12, 1734);
    			add_location(span6, file, 52, 16, 1979);
    			attr_dev(input6, "type", "range");
    			attr_dev(input6, "min", "1000");
    			attr_dev(input6, "max", "15000");
    			attr_dev(input6, "step", "500");
    			add_location(input6, file, 53, 16, 2029);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file, 51, 12, 1944);
    			attr_dev(div11, "class", "group");
    			add_location(div11, file, 45, 8, 1676);
    			attr_dev(nav, "class", "svelte-1895ym0");
    			toggle_class(nav, "visible", /*visible*/ ctx[1]);
    			add_location(nav, file, 9, 4, 225);
    			attr_dev(div12, "class", "options");
    			add_location(div12, file, 7, 0, 113);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div0);
    			append_dev(div12, t0);
    			append_dev(div12, nav);
    			append_dev(nav, h2);
    			append_dev(nav, t2);
    			append_dev(nav, div3);
    			append_dev(div3, h30);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t6);
    			append_dev(div1, input0);
    			input0.checked = /*config*/ ctx[0].parallax.enabled;
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t9);
    			append_dev(div2, input1);
    			set_input_value(input1, /*config*/ ctx[0].parallax.treshold);
    			append_dev(nav, t10);
    			append_dev(nav, div6);
    			append_dev(div6, h31);
    			append_dev(div6, t12);
    			append_dev(div6, div4);
    			append_dev(div4, span2);
    			append_dev(div4, t14);
    			append_dev(div4, input2);
    			input2.checked = /*config*/ ctx[0].rpc;
    			append_dev(div6, t15);
    			append_dev(div6, div5);
    			append_dev(div5, span3);
    			append_dev(div5, t17);
    			append_dev(div5, input3);
    			input3.checked = /*config*/ ctx[0].mediaSession;
    			append_dev(nav, t18);
    			append_dev(nav, div8);
    			append_dev(div8, h32);
    			append_dev(div8, t20);
    			append_dev(div8, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*config*/ ctx[0].backgrounds);
    			append_dev(div8, t23);
    			append_dev(div8, div7);
    			append_dev(div7, span4);
    			append_dev(div7, t25);
    			append_dev(div7, input4);
    			input4.checked = /*config*/ ctx[0].videoBackground;
    			append_dev(nav, t26);
    			append_dev(nav, div11);
    			append_dev(div11, h33);
    			append_dev(div11, t28);
    			append_dev(div11, div9);
    			append_dev(div9, span5);
    			append_dev(div9, t30);
    			append_dev(div9, input5);
    			set_input_value(input5, /*config*/ ctx[0].autohide.info);
    			append_dev(div11, t31);
    			append_dev(div11, div10);
    			append_dev(div10, span6);
    			append_dev(div10, t33);
    			append_dev(div10, input6);
    			set_input_value(input6, /*config*/ ctx[0].autohide.volume);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[5]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[6]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[7]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[8]),
    					listen_dev(input5, "change", /*input5_change_input_handler*/ ctx[9]),
    					listen_dev(input5, "input", /*input5_change_input_handler*/ ctx[9]),
    					listen_dev(input6, "change", /*input6_change_input_handler*/ ctx[10]),
    					listen_dev(input6, "input", /*input6_change_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*visible*/ 2) {
    				toggle_class(div0, "visible", /*visible*/ ctx[1]);
    			}

    			if (dirty & /*config*/ 1) {
    				input0.checked = /*config*/ ctx[0].parallax.enabled;
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input1, /*config*/ ctx[0].parallax.treshold);
    			}

    			if (dirty & /*config*/ 1) {
    				toggle_class(div2, "enabled", /*config*/ ctx[0].parallax.enabled);
    			}

    			if (dirty & /*config*/ 1) {
    				input2.checked = /*config*/ ctx[0].rpc;
    			}

    			if (dirty & /*config*/ 1) {
    				input3.checked = /*config*/ ctx[0].mediaSession;
    			}

    			if (dirty & /*config*/ 1) {
    				select_option(select, /*config*/ ctx[0].backgrounds);
    			}

    			if (dirty & /*config*/ 1) {
    				input4.checked = /*config*/ ctx[0].videoBackground;
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input5, /*config*/ ctx[0].autohide.info);
    			}

    			if (dirty & /*config*/ 1) {
    				set_input_value(input6, /*config*/ ctx[0].autohide.volume);
    			}

    			if (dirty & /*visible*/ 2) {
    				toggle_class(nav, "visible", /*visible*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
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
    	validate_slots("Options", slots, []);
    	var { config } = $$props;
    	var { visible } = $$props;
    	const writable_props = ["config", "visible"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Options> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, visible = false);

    	function input0_change_handler() {
    		config.parallax.enabled = this.checked;
    		$$invalidate(0, config);
    	}

    	function input1_change_input_handler() {
    		config.parallax.treshold = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input2_change_handler() {
    		config.rpc = this.checked;
    		$$invalidate(0, config);
    	}

    	function input3_change_handler() {
    		config.mediaSession = this.checked;
    		$$invalidate(0, config);
    	}

    	function select_change_handler() {
    		config.backgrounds = select_value(this);
    		$$invalidate(0, config);
    	}

    	function input4_change_handler() {
    		config.videoBackground = this.checked;
    		$$invalidate(0, config);
    	}

    	function input5_change_input_handler() {
    		config.autohide.info = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	function input6_change_input_handler() {
    		config.autohide.volume = to_number(this.value);
    		$$invalidate(0, config);
    	}

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
    	};

    	$$self.$capture_state = () => ({ config, visible });

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*config*/ 1) {
    			 console.log("Config", config);
    		}
    	};

    	return [
    		config,
    		visible,
    		click_handler,
    		input0_change_handler,
    		input1_change_input_handler,
    		input2_change_handler,
    		input3_change_handler,
    		select_change_handler,
    		input4_change_handler,
    		input5_change_input_handler,
    		input6_change_input_handler
    	];
    }

    class Options extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { config: 0, visible: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Options",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[0] === undefined && !("config" in props)) {
    			console_1.warn("<Options> was created without expected prop 'config'");
    		}

    		if (/*visible*/ ctx[1] === undefined && !("visible" in props)) {
    			console_1.warn("<Options> was created without expected prop 'visible'");
    		}
    	}

    	get config() {
    		throw new Error("<Options>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Options>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Options>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Options>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Menu.svelte generated by Svelte v3.25.1 */

    const { console: console_1$1, window: window_1 } = globals;
    const file$1 = "src\\Menu.svelte";

    // (146:4) {#if now - last < config.autohide.info + 1000}
    function create_if_block_1(ctx) {
    	let div;
    	let if_block = /*song*/ ctx[0] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "info svelte-1qt5obi");
    			toggle_class(div, "hidden", /*now*/ ctx[5] - /*last*/ ctx[2] > /*config*/ ctx[1].autohide.info);
    			add_location(div, file$1, 146, 8, 4944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*song*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*now, last, config*/ 38) {
    				toggle_class(div, "hidden", /*now*/ ctx[5] - /*last*/ ctx[2] > /*config*/ ctx[1].autohide.info);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(146:4) {#if now - last < config.autohide.info + 1000}",
    		ctx
    	});

    	return block;
    }

    // (148:12) {#if song}
    function create_if_block_2(ctx) {
    	let div4;
    	let h2;
    	let t0_value = /*song*/ ctx[0].artist + "";
    	let t0;
    	let t1;
    	let t2_value = /*song*/ ctx[0].song + "";
    	let t2;
    	let t3;
    	let div3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let img0_alt_value;
    	let img0_title_value;
    	let t4;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div2;
    	let img2;
    	let img2_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = space();
    			div3 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t5 = space();
    			div2 = element("div");
    			img2 = element("img");
    			attr_dev(h2, "class", "svelte-1qt5obi");
    			add_location(h2, file$1, 149, 20, 5093);
    			if (img0.src !== (img0_src_value = "images/music_" + (/*song*/ ctx[0].playing ? "pause" : "play") + ".svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", img0_alt_value = "" + ((/*song*/ ctx[0].playing ? "Pause" : "Play") + " music"));
    			attr_dev(img0, "title", img0_title_value = "" + ((/*song*/ ctx[0].playing ? "Pause" : "Play") + " music"));
    			attr_dev(img0, "class", "svelte-1qt5obi");
    			add_location(img0, file$1, 152, 28, 5269);
    			attr_dev(div0, "class", "play svelte-1qt5obi");
    			add_location(div0, file$1, 151, 24, 5199);
    			if (img1.src !== (img1_src_value = "images/music_forward.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Skip the song");
    			attr_dev(img1, "title", "Skip the song");
    			attr_dev(img1, "class", "svelte-1qt5obi");
    			add_location(img1, file$1, 155, 28, 5554);
    			attr_dev(div1, "class", "forward svelte-1qt5obi");
    			add_location(div1, file$1, 154, 24, 5483);
    			if (img2.src !== (img2_src_value = "images/settings.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Settings");
    			attr_dev(img2, "title", "Open settings");
    			attr_dev(img2, "class", "svelte-1qt5obi");
    			add_location(img2, file$1, 158, 28, 5788);
    			attr_dev(div2, "class", "settings svelte-1qt5obi");
    			add_location(div2, file$1, 157, 24, 5690);
    			attr_dev(div3, "class", "controls svelte-1qt5obi");
    			add_location(div3, file$1, 150, 20, 5151);
    			attr_dev(div4, "class", "song svelte-1qt5obi");
    			add_location(div4, file$1, 148, 16, 5053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, img1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*togglePlay*/ ctx[7], false, false, false),
    					listen_dev(div1, "click", /*playNext*/ ctx[6], false, false, false),
    					listen_dev(div2, "click", /*click_handler*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*song*/ 1 && t0_value !== (t0_value = /*song*/ ctx[0].artist + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*song*/ 1 && t2_value !== (t2_value = /*song*/ ctx[0].song + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*song*/ 1 && img0.src !== (img0_src_value = "images/music_" + (/*song*/ ctx[0].playing ? "pause" : "play") + ".svg")) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*song*/ 1 && img0_alt_value !== (img0_alt_value = "" + ((/*song*/ ctx[0].playing ? "Pause" : "Play") + " music"))) {
    				attr_dev(img0, "alt", img0_alt_value);
    			}

    			if (dirty & /*song*/ 1 && img0_title_value !== (img0_title_value = "" + ((/*song*/ ctx[0].playing ? "Pause" : "Play") + " music"))) {
    				attr_dev(img0, "title", img0_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(148:12) {#if song}",
    		ctx
    	});

    	return block;
    }

    // (166:4) {#if now - lastVolumeUpdate < config.autohide.volume + 1000 && song && song.audio}
    function create_if_block(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0_value = Math.round(/*song*/ ctx[0].audio.volume * 100) + "";
    	let t0;
    	let t1;
    	let t2;
    	let svg;
    	let circle;
    	let circle_stroke_dasharray_value;
    	let circle_stroke_dashoffset_value;
    	let circle_r_value;
    	let circle_cx_value;
    	let circle_cy_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text("%");
    			t2 = space();
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(div0, "class", "percent svelte-1qt5obi");
    			add_location(div0, file$1, 168, 16, 6219);
    			attr_dev(circle, "stroke-width", volumeStroke);
    			attr_dev(circle, "fill", "transparent");
    			attr_dev(circle, "stroke", "blue");
    			attr_dev(circle, "stroke-dasharray", circle_stroke_dasharray_value = volumeRadius * 2 * Math.PI + " " + volumeRadius * 2 * Math.PI);
    			attr_dev(circle, "stroke-dashoffset", circle_stroke_dashoffset_value = volumeRadius * 2 * Math.PI - /*song*/ ctx[0].audio.volume * volumeRadius * 2 * Math.PI);
    			attr_dev(circle, "r", circle_r_value = volumeRadius - 1);
    			attr_dev(circle, "cx", circle_cx_value = volumeRadius - 1);
    			attr_dev(circle, "cy", circle_cy_value = volumeRadius + 1);
    			attr_dev(circle, "class", "svelte-1qt5obi");
    			add_location(circle, file$1, 172, 20, 6432);
    			attr_dev(svg, "class", "progress-ring svelte-1qt5obi");
    			attr_dev(svg, "width", volumeWidth);
    			attr_dev(svg, "height", volumeWidth);
    			add_location(svg, file$1, 171, 16, 6342);
    			attr_dev(div1, "class", "slider svelte-1qt5obi");
    			add_location(div1, file$1, 167, 12, 6181);
    			attr_dev(div2, "class", "volume svelte-1qt5obi");
    			toggle_class(div2, "hidden", /*now*/ ctx[5] - /*lastVolumeUpdate*/ ctx[3] > /*config*/ ctx[1].autohide.volume);
    			add_location(div2, file$1, 166, 8, 6084);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, svg);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*song*/ 1 && t0_value !== (t0_value = Math.round(/*song*/ ctx[0].audio.volume * 100) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*song*/ 1 && circle_stroke_dashoffset_value !== (circle_stroke_dashoffset_value = volumeRadius * 2 * Math.PI - /*song*/ ctx[0].audio.volume * volumeRadius * 2 * Math.PI)) {
    				attr_dev(circle, "stroke-dashoffset", circle_stroke_dashoffset_value);
    			}

    			if (dirty & /*now, lastVolumeUpdate, config*/ 42) {
    				toggle_class(div2, "hidden", /*now*/ ctx[5] - /*lastVolumeUpdate*/ ctx[3] > /*config*/ ctx[1].autohide.volume);
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
    		source: "(166:4) {#if now - lastVolumeUpdate < config.autohide.volume + 1000 && song && song.audio}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let options;
    	let updating_config;
    	let updating_visible;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*now*/ ctx[5] - /*last*/ ctx[2] < /*config*/ ctx[1].autohide.info + 1000 && create_if_block_1(ctx);
    	let if_block1 = /*now*/ ctx[5] - /*lastVolumeUpdate*/ ctx[3] < /*config*/ ctx[1].autohide.volume + 1000 && /*song*/ ctx[0] && /*song*/ ctx[0].audio && create_if_block(ctx);

    	function options_config_binding(value) {
    		/*options_config_binding*/ ctx[13].call(null, value);
    	}

    	function options_visible_binding(value) {
    		/*options_visible_binding*/ ctx[14].call(null, value);
    	}

    	let options_props = {};

    	if (/*config*/ ctx[1] !== void 0) {
    		options_props.config = /*config*/ ctx[1];
    	}

    	if (/*settingsOpen*/ ctx[4] !== void 0) {
    		options_props.visible = /*settingsOpen*/ ctx[4];
    	}

    	options = new Options({ props: options_props, $$inline: true });
    	binding_callbacks.push(() => bind(options, "config", options_config_binding));
    	binding_callbacks.push(() => bind(options, "visible", options_visible_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(options.$$.fragment);
    			attr_dev(div, "class", "menu");
    			add_location(div, file$1, 144, 0, 4864);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			mount_component(options, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mousemove", /*mousemove_handler*/ ctx[10], false, false, false),
    					listen_dev(window_1, "wheel", /*wheel_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*now*/ ctx[5] - /*last*/ ctx[2] < /*config*/ ctx[1].autohide.info + 1000) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*now*/ ctx[5] - /*lastVolumeUpdate*/ ctx[3] < /*config*/ ctx[1].autohide.volume + 1000 && /*song*/ ctx[0] && /*song*/ ctx[0].audio) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const options_changes = {};

    			if (!updating_config && dirty & /*config*/ 2) {
    				updating_config = true;
    				options_changes.config = /*config*/ ctx[1];
    				add_flush_callback(() => updating_config = false);
    			}

    			if (!updating_visible && dirty & /*settingsOpen*/ 16) {
    				updating_visible = true;
    				options_changes.visible = /*settingsOpen*/ ctx[4];
    				add_flush_callback(() => updating_visible = false);
    			}

    			options.$set(options_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(options.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(options.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(options);
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

    const volumeWidth = 100;
    const volumeStroke = 4;
    const volumeRadius = 50;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	const fs = require("fs");
    	const osuParser = require("./lib/osu-parser.js");
    	var { osuData } = $$props;
    	var { song } = $$props;
    	var { config } = $$props;
    	var last = Date.now();
    	var lastVolumeUpdate = Date.now() - 5000;
    	var settingsOpen = false;
    	var now = Date.now();

    	setInterval(
    		() => {
    			$$invalidate(5, now = Date.now());
    		},
    		800
    	);

    	function resetPool() {
    		if (!osuData.songs) return false;
    		$$invalidate(9, osuData.songPool = osuData.songs.filter(v => true), osuData);
    		let a = osuData.songPool;

    		for (let i = a.length - 1; i > 0; i--) {
    			// shuffle
    			const j = Math.floor(Math.random() * (i + 1));

    			[a[i], a[j]] = [a[j], a[i]];
    		}

    		osuData.songPool.forEach(v => {
    			delete v.audio;
    			delete v.video;
    			v.playing = true;
    		});

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
    		$$invalidate(0, song.playing = !song.playing, song);
    		if (!song.audio) return;

    		if (song.playing) {
    			song.audio.play();
    		} else {
    			song.audio.pause();
    		}
    	}

    	var volume = 1;

    	function updateVolume(e) {
    		if (!song || !song.audio || !e.altKey) return;
    		$$invalidate(3, lastVolumeUpdate = Date.now());
    		$$invalidate(15, volume += e.deltaY * -0.0005);
    		$$invalidate(15, volume = Math.min(1, Math.max(volume, 0)));
    	}

    	setTimeout(
    		() => {
    			playNext();
    		},
    		200
    	);

    	const writable_props = ["osuData", "song", "config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = () => $$invalidate(2, last = Date.now());
    	const wheel_handler = e => updateVolume(e);
    	const click_handler = () => $$invalidate(4, settingsOpen = !settingsOpen);

    	function options_config_binding(value) {
    		config = value;
    		$$invalidate(1, config);
    	}

    	function options_visible_binding(value) {
    		settingsOpen = value;
    		$$invalidate(4, settingsOpen);
    	}

    	$$self.$$set = $$props => {
    		if ("osuData" in $$props) $$invalidate(9, osuData = $$props.osuData);
    		if ("song" in $$props) $$invalidate(0, song = $$props.song);
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		Options,
    		fs,
    		osuParser,
    		osuData,
    		song,
    		config,
    		last,
    		lastVolumeUpdate,
    		settingsOpen,
    		now,
    		resetPool,
    		playNext,
    		togglePlay,
    		volume,
    		updateVolume,
    		volumeWidth,
    		volumeStroke,
    		volumeRadius
    	});

    	$$self.$inject_state = $$props => {
    		if ("osuData" in $$props) $$invalidate(9, osuData = $$props.osuData);
    		if ("song" in $$props) $$invalidate(0, song = $$props.song);
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    		if ("last" in $$props) $$invalidate(2, last = $$props.last);
    		if ("lastVolumeUpdate" in $$props) $$invalidate(3, lastVolumeUpdate = $$props.lastVolumeUpdate);
    		if ("settingsOpen" in $$props) $$invalidate(4, settingsOpen = $$props.settingsOpen);
    		if ("now" in $$props) $$invalidate(5, now = $$props.now);
    		if ("volume" in $$props) $$invalidate(15, volume = $$props.volume);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*osuData*/ 512) {
    			 resetPool(osuData.songs);
    		}

    		if ($$self.$$.dirty & /*song, config*/ 3) {
    			 {
    				(() => {
    					if (song && song.folder && !song.audio) {
    						// var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    						// song.context = audioCtx;
    						// song.analyser = audioCtx.createAnalyser();
    						$$invalidate(0, song.audio = new Audio(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + song.folder + "/" + song.audioFile), song);

    						// song.source = audioCtx.createMediaElementSource(song.audio);
    						// song.source.connect(song.analyser);
    						// song.analyser.connect(audioCtx.destination);
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
    								$$invalidate(0, song.playing = false, song);
    								if (song.video) song.video.pause();
    							},
    							song
    						);

    						$$invalidate(
    							0,
    							song.audio.onplay = () => {
    								$$invalidate(0, song.playing = true, song);
    								if (song.video) song.video.play();
    							},
    							song
    						);

    						if ("mediaSession" in navigator && config.mediaSession) {
    							navigator.mediaSession.metadata = new MediaMetadata({
    									title: song.song,
    									artist: song.artist,
    									album: "Osu! visualizer",
    									artwork: [], // { src: process.env.USERPROFILE + "/AppData/Local/osu!/Data/bt/" + song.id + ".jpg", type: 'image/jpeg' },
    									
    								});

    							navigator.mediaSession.setActionHandler("play", function () {
    								$$invalidate(0, song.playing = true, song);
    								song.audio.play();
    							});

    							navigator.mediaSession.setActionHandler("pause", function () {
    								$$invalidate(0, song.playing = false, song);
    								song.audio.pause();
    							});

    							navigator.mediaSession.setActionHandler("nexttrack", function () {
    								playNext();
    							});
    						}
    					}
    				})();
    			}
    		}

    		if ($$self.$$.dirty & /*song, volume*/ 32769) {
    			 if (song.audio) $$invalidate(0, song.audio.volume = volume, song);
    		}

    		if ($$self.$$.dirty & /*song*/ 1) {
    			 console.log(song);
    		}

    		if ($$self.$$.dirty & /*song, config*/ 3) {
    			 if (song && song.audio && config.rpc) {
    				if (song.playing) {
    					window.songActivity = {
    						state: "Listening to osu! beatmaps",
    						details: `${song.artist} - ${song.song}`,
    						startTimestamp: Date.now(),
    						endTimestamp: Date.now() + song.audio.duration * 1000,
    						instance: false,
    						largeImageKey: "logo",
    						largeImageText: "Osu!visualizer"
    					};
    				} else {
    					window.songActivity = {
    						state: "Paused",
    						details: `${song.artist} - ${song.song}`,
    						instance: false,
    						largeImageKey: "logo",
    						largeImageText: "Osu!visualizer"
    					};
    				}
    			}
    		}
    	};

    	return [
    		song,
    		config,
    		last,
    		lastVolumeUpdate,
    		settingsOpen,
    		now,
    		playNext,
    		togglePlay,
    		updateVolume,
    		osuData,
    		mousemove_handler,
    		wheel_handler,
    		click_handler,
    		options_config_binding,
    		options_visible_binding
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { osuData: 9, song: 0, config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*osuData*/ ctx[9] === undefined && !("osuData" in props)) {
    			console_1$1.warn("<Menu> was created without expected prop 'osuData'");
    		}

    		if (/*song*/ ctx[0] === undefined && !("song" in props)) {
    			console_1$1.warn("<Menu> was created without expected prop 'song'");
    		}

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
    			console_1$1.warn("<Menu> was created without expected prop 'config'");
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

    	get config() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Visualizer.svelte generated by Svelte v3.25.1 */

    const { console: console_1$2, window: window_1$1 } = globals;
    const file$2 = "src\\Visualizer.svelte";

    // (155:4) {#if songData && songData.beatmap && songData.beatmap.video && config.videoBackground}
    function create_if_block$1(ctx) {
    	let video;
    	let source;
    	let source_src_value;

    	const block = {
    		c: function create() {
    			video = element("video");
    			source = element("source");
    			if (source.src !== (source_src_value = "file:///" + process.env.USERPROFILE.replace(/\\/g, "/") + "/AppData/Local/osu!/Songs/" + /*songData*/ ctx[0].folder + "/" + /*songData*/ ctx[0].beatmap.video)) attr_dev(source, "src", source_src_value);
    			add_location(source, file$2, 162, 12, 6027);

    			set_style(video, "width", /*isWidthSmaller*/ ctx[5]
    			? "auto"
    			: `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);

    			set_style(video, "height", !/*isWidthSmaller*/ ctx[5]
    			? "auto"
    			: `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);

    			set_style(video, "top", /*mouse*/ ctx[3].y + "px");
    			set_style(video, "left", /*mouse*/ ctx[3].x + "px");
    			attr_dev(video, "class", "svelte-18bmol8");
    			add_location(video, file$2, 156, 8, 5710);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, video, anchor);
    			append_dev(video, source);
    			/*video_binding*/ ctx[11](video);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*songData*/ 1 && source.src !== (source_src_value = "file:///" + process.env.USERPROFILE.replace(/\\/g, "/") + "/AppData/Local/osu!/Songs/" + /*songData*/ ctx[0].folder + "/" + /*songData*/ ctx[0].beatmap.video)) {
    				attr_dev(source, "src", source_src_value);
    			}

    			if (dirty & /*isWidthSmaller, parallaxTreshold*/ 48) {
    				set_style(video, "width", /*isWidthSmaller*/ ctx[5]
    				? "auto"
    				: `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);
    			}

    			if (dirty & /*isWidthSmaller, parallaxTreshold*/ 48) {
    				set_style(video, "height", !/*isWidthSmaller*/ ctx[5]
    				? "auto"
    				: `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);
    			}

    			if (dirty & /*mouse*/ 8) {
    				set_style(video, "top", /*mouse*/ ctx[3].y + "px");
    			}

    			if (dirty & /*mouse*/ 8) {
    				set_style(video, "left", /*mouse*/ ctx[3].x + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(video);
    			/*video_binding*/ ctx[11](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(155:4) {#if songData && songData.beatmap && songData.beatmap.video && config.videoBackground}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;
    	let if_block = /*songData*/ ctx[0] && /*songData*/ ctx[0].beatmap && /*songData*/ ctx[0].beatmap.video && /*config*/ ctx[1].videoBackground && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			img0 = element("img");
    			t1 = space();
    			img1 = element("img");
    			if (img0.src !== (img0_src_value = "images/logo.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "logo svelte-18bmol8");
    			set_style(img0, "animation-duration", /*animDuration*/ ctx[6] + "ms");
    			toggle_class(img0, "repeat", /*songData*/ ctx[0].playing);
    			add_location(img0, file$2, 165, 4, 6198);
    			if (img1.src !== (img1_src_value = "images/logo.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "shadow svelte-18bmol8");
    			set_style(img1, "animation-duration", /*animDuration*/ ctx[6] * 2 + "ms");
    			toggle_class(img1, "repeat", /*songData*/ ctx[0].playing);
    			add_location(img1, file$2, 166, 4, 6333);
    			attr_dev(div, "class", "main svelte-18bmol8");
    			set_style(div, "background-image", "url('" + /*wallpaper*/ ctx[2] + "')");

    			set_style(div, "background-size", !/*isWidthSmaller*/ ctx[5]
    			? `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px) auto`
    			: `auto calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);

    			set_style(div, "background-position", /*mouse*/ ctx[3].x + "px " + /*mouse*/ ctx[3].y + "px");
    			add_location(div, file$2, 146, 0, 5261);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, img0);
    			append_dev(div, t1);
    			append_dev(div, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1$1, "mousemove", /*updateMouse*/ ctx[8], false, false, false),
    					listen_dev(window_1$1, "resize", /*resize*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*songData*/ ctx[0] && /*songData*/ ctx[0].beatmap && /*songData*/ ctx[0].beatmap.video && /*config*/ ctx[1].videoBackground) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*animDuration*/ 64) {
    				set_style(img0, "animation-duration", /*animDuration*/ ctx[6] + "ms");
    			}

    			if (dirty & /*songData*/ 1) {
    				toggle_class(img0, "repeat", /*songData*/ ctx[0].playing);
    			}

    			if (dirty & /*animDuration*/ 64) {
    				set_style(img1, "animation-duration", /*animDuration*/ ctx[6] * 2 + "ms");
    			}

    			if (dirty & /*songData*/ 1) {
    				toggle_class(img1, "repeat", /*songData*/ ctx[0].playing);
    			}

    			if (dirty & /*wallpaper*/ 4) {
    				set_style(div, "background-image", "url('" + /*wallpaper*/ ctx[2] + "')");
    			}

    			if (dirty & /*isWidthSmaller, parallaxTreshold*/ 48) {
    				set_style(div, "background-size", !/*isWidthSmaller*/ ctx[5]
    				? `calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px) auto`
    				: `auto calc(100% + ${/*parallaxTreshold*/ ctx[4] * 1.5}px)`);
    			}

    			if (dirty & /*mouse*/ 8) {
    				set_style(div, "background-position", /*mouse*/ ctx[3].x + "px " + /*mouse*/ ctx[3].y + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Visualizer", slots, []);
    	const fs = require("fs");
    	const OsuDBParser = require("osu-db-parser");
    	const osuParser = require("./lib/osu-parser.js");
    	var { osuData } = $$props;
    	var { songData } = $$props;
    	var { config } = $$props;
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
    			dataFile: `${v.artist_name} - ${v.song_title} (${v.creator_name}) [${v.difficulty}].osu`.replace(/\/|\*|"|:|\?/g, ""),
    			playing: true
    		})).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
    	} catch(e) {
    		console.error("Osu DB weren't found. You must have osu installed and started at least once.", e);
    		alert("Osu DB not found!");
    	}

    	var wallpaper;

    	function shuffleWallpapers() {
    		switch (config.backgrounds) {
    			case 0:
    				$$invalidate(2, wallpaper = `${process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Data/bg/${wallpapers[Math.floor(Math.random() * wallpapers.length)]}`);
    				break;
    			case 1:
    				if (songData.beatmap) {
    					$$invalidate(2, wallpaper = `${process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Songs/${songData.folder}/${songData.beatmap.bgFilename}`);
    				} else {
    					$$invalidate(2, wallpaper = `${process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Data/bg/${wallpapers[Math.floor(Math.random() * wallpapers.length)]}`);
    				}
    				break;
    			default:
    				$$invalidate(2, wallpaper = `${process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Data/bg/${wallpapers[Math.floor(Math.random() * wallpapers.length)]}`);
    		}
    	}

    	shuffleWallpapers();
    	var lastSong = null;
    	var lastBackgroundOption = null;

    	function fetchBeatmap() {
    		let file = fs.readFileSync(process.env.USERPROFILE + "/AppData/Local/osu!/Songs/" + songData.folder + "/" + songData.dataFile);
    		$$invalidate(0, songData.beatmap = osuParser.parseContent(file), songData);

    		if (config.backgrounds === 1) {
    			$$invalidate(2, wallpaper = `${process.env.USERPROFILE.replace(/\\/g, "/")}/AppData/Local/osu!/Songs/${songData.folder}/${songData.beatmap.bgFilename}`);
    		}
    	}

    	var mouse = { x: 0.5, y: 0.5 };
    	var parallaxTreshold;

    	function updateMouse(e) {
    		if (!config.parallax.enabled) return;

    		$$invalidate(3, mouse = {
    			x: -(e.clientX / window.innerWidth) * parallaxTreshold - parallaxTreshold / 2,
    			y: -(e.clientY / window.innerHeight) * parallaxTreshold - parallaxTreshold / 2
    		});
    	}

    	var isWidthSmaller = false;

    	function resize() {
    		$$invalidate(5, isWidthSmaller = window.innerWidth * 9 < window.innerHeight * 16);
    	}

    	resize();
    	var animDuration = 0;
    	var kiaiTime = false;

    	setInterval(
    		() => {
    			if (!songData) return;
    			if (!songData.beatmap && songData.dataFile) fetchBeatmap();
    			if (!songData.beatmap || !songData.audio) return;
    			var tp = null;

    			for (var t of songData.beatmap.timingPoints) {
    				if (t.offset > songData.audio.currentTime * 1000) break;
    				tp = t;
    			}

    			if (!tp) {
    				$$invalidate(6, animDuration = 0);
    				kiaiTime = false;
    				return;
    			}

    			if (tp.beatLength / 2 !== animDuration) $$invalidate(6, animDuration = tp.beatLength / 2);
    			kiaiTime = tp.kiaiTimeActive;
    		},
    		50
    	);

    	var backgroundVideo;
    	const writable_props = ["osuData", "songData", "config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Visualizer> was created with unknown prop '${key}'`);
    	});

    	function video_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			backgroundVideo = $$value;
    			$$invalidate(7, backgroundVideo);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("osuData" in $$props) $$invalidate(10, osuData = $$props.osuData);
    		if ("songData" in $$props) $$invalidate(0, songData = $$props.songData);
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		fs,
    		OsuDBParser,
    		osuParser,
    		osuData,
    		songData,
    		config,
    		wallpapers,
    		wallpaper,
    		shuffleWallpapers,
    		lastSong,
    		lastBackgroundOption,
    		fetchBeatmap,
    		mouse,
    		parallaxTreshold,
    		updateMouse,
    		isWidthSmaller,
    		resize,
    		animDuration,
    		kiaiTime,
    		backgroundVideo
    	});

    	$$self.$inject_state = $$props => {
    		if ("osuData" in $$props) $$invalidate(10, osuData = $$props.osuData);
    		if ("songData" in $$props) $$invalidate(0, songData = $$props.songData);
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    		if ("wallpapers" in $$props) wallpapers = $$props.wallpapers;
    		if ("wallpaper" in $$props) $$invalidate(2, wallpaper = $$props.wallpaper);
    		if ("lastSong" in $$props) $$invalidate(13, lastSong = $$props.lastSong);
    		if ("lastBackgroundOption" in $$props) $$invalidate(14, lastBackgroundOption = $$props.lastBackgroundOption);
    		if ("mouse" in $$props) $$invalidate(3, mouse = $$props.mouse);
    		if ("parallaxTreshold" in $$props) $$invalidate(4, parallaxTreshold = $$props.parallaxTreshold);
    		if ("isWidthSmaller" in $$props) $$invalidate(5, isWidthSmaller = $$props.isWidthSmaller);
    		if ("animDuration" in $$props) $$invalidate(6, animDuration = $$props.animDuration);
    		if ("kiaiTime" in $$props) kiaiTime = $$props.kiaiTime;
    		if ("backgroundVideo" in $$props) $$invalidate(7, backgroundVideo = $$props.backgroundVideo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*backgroundVideo, songData*/ 129) {
    			 {
    				if (backgroundVideo) {
    					$$invalidate(0, songData.video = backgroundVideo, songData);

    					if (songData && songData.audio && songData.video) {
    						$$invalidate(0, songData.video.currentTime = songData.audio.currentTime, songData);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*songData, lastSong, config, lastBackgroundOption*/ 24579) {
    			 {
    				if (songData !== lastSong) {
    					$$invalidate(13, lastSong = songData);
    					shuffleWallpapers();
    				}

    				if (config.backgrounds !== lastBackgroundOption) {
    					$$invalidate(14, lastBackgroundOption = config.backgrounds);
    					shuffleWallpapers();
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*songData*/ 1) {
    			 if (songData && songData.dataFile && !songData.beatmap) fetchBeatmap();
    		}

    		if ($$self.$$.dirty & /*config*/ 2) {
    			 $$invalidate(4, parallaxTreshold = config.parallax.treshold);
    		}

    		if ($$self.$$.dirty & /*songData, config*/ 3) {
    			 {
    				if (!songData || !songData.beatmap || !songData.beatmap.video || !config.videoBackground) window.backgroundVideo = null;
    			}
    		}

    		if ($$self.$$.dirty & /*wallpaper*/ 4) {
    			 console.log("Wallpaper", wallpaper);
    		}

    		if ($$self.$$.dirty & /*songData*/ 1) {
    			 console.log("Beatmap", songData.beatmap);
    		}
    	};

    	return [
    		songData,
    		config,
    		wallpaper,
    		mouse,
    		parallaxTreshold,
    		isWidthSmaller,
    		animDuration,
    		backgroundVideo,
    		updateMouse,
    		resize,
    		osuData,
    		video_binding
    	];
    }

    class Visualizer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { osuData: 10, songData: 0, config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Visualizer",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*osuData*/ ctx[10] === undefined && !("osuData" in props)) {
    			console_1$2.warn("<Visualizer> was created without expected prop 'osuData'");
    		}

    		if (/*songData*/ ctx[0] === undefined && !("songData" in props)) {
    			console_1$2.warn("<Visualizer> was created without expected prop 'songData'");
    		}

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
    			console_1$2.warn("<Visualizer> was created without expected prop 'config'");
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

    	get config() {
    		throw new Error("<Visualizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Visualizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.25.1 */
    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
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
    	let updating_config;
    	let current;

    	function visualizer_songData_binding(value) {
    		/*visualizer_songData_binding*/ ctx[3].call(null, value);
    	}

    	function visualizer_osuData_binding(value) {
    		/*visualizer_osuData_binding*/ ctx[4].call(null, value);
    	}

    	let visualizer_props = { config: /*config*/ ctx[1] };

    	if (/*songData*/ ctx[0] !== void 0) {
    		visualizer_props.songData = /*songData*/ ctx[0];
    	}

    	if (/*osuData*/ ctx[2] !== void 0) {
    		visualizer_props.osuData = /*osuData*/ ctx[2];
    	}

    	visualizer = new Visualizer({ props: visualizer_props, $$inline: true });
    	binding_callbacks.push(() => bind(visualizer, "songData", visualizer_songData_binding));
    	binding_callbacks.push(() => bind(visualizer, "osuData", visualizer_osuData_binding));

    	function menu_song_binding(value) {
    		/*menu_song_binding*/ ctx[5].call(null, value);
    	}

    	function menu_osuData_binding(value) {
    		/*menu_osuData_binding*/ ctx[6].call(null, value);
    	}

    	function menu_config_binding(value) {
    		/*menu_config_binding*/ ctx[7].call(null, value);
    	}

    	let menu_props = {};

    	if (/*songData*/ ctx[0] !== void 0) {
    		menu_props.song = /*songData*/ ctx[0];
    	}

    	if (/*osuData*/ ctx[2] !== void 0) {
    		menu_props.osuData = /*osuData*/ ctx[2];
    	}

    	if (/*config*/ ctx[1] !== void 0) {
    		menu_props.config = /*config*/ ctx[1];
    	}

    	menu = new Menu({ props: menu_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu, "song", menu_song_binding));
    	binding_callbacks.push(() => bind(menu, "osuData", menu_osuData_binding));
    	binding_callbacks.push(() => bind(menu, "config", menu_config_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			create_component(visualizer.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(menu.$$.fragment);
    			attr_dev(div0, "class", "background svelte-5atqf");
    			add_location(div0, file$3, 51, 4, 1440);
    			attr_dev(div1, "class", "menu svelte-5atqf");
    			add_location(div1, file$3, 54, 4, 1542);
    			attr_dev(main, "class", "svelte-5atqf");
    			add_location(main, file$3, 50, 0, 1428);
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
    			if (dirty & /*config*/ 2) visualizer_changes.config = /*config*/ ctx[1];

    			if (!updating_songData && dirty & /*songData*/ 1) {
    				updating_songData = true;
    				visualizer_changes.songData = /*songData*/ ctx[0];
    				add_flush_callback(() => updating_songData = false);
    			}

    			if (!updating_osuData && dirty & /*osuData*/ 4) {
    				updating_osuData = true;
    				visualizer_changes.osuData = /*osuData*/ ctx[2];
    				add_flush_callback(() => updating_osuData = false);
    			}

    			visualizer.$set(visualizer_changes);
    			const menu_changes = {};

    			if (!updating_song && dirty & /*songData*/ 1) {
    				updating_song = true;
    				menu_changes.song = /*songData*/ ctx[0];
    				add_flush_callback(() => updating_song = false);
    			}

    			if (!updating_osuData_1 && dirty & /*osuData*/ 4) {
    				updating_osuData_1 = true;
    				menu_changes.osuData = /*osuData*/ ctx[2];
    				add_flush_callback(() => updating_osuData_1 = false);
    			}

    			if (!updating_config && dirty & /*config*/ 2) {
    				updating_config = true;
    				menu_changes.config = /*config*/ ctx[1];
    				add_flush_callback(() => updating_config = false);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const Store = require("electron-store");
    	const store = new Store();
    	var songData = {};
    	var config = store.get("config");
    	var osuData = {};

    	(() => {
    		const configTemplate = {
    			parallax: { enabled: true, treshold: 10 },
    			rpc: true,
    			backgrounds: 0,
    			mediaSession: true,
    			videoBackground: true,
    			autohide: { info: 2000, volume: 2000 }
    		};

    		function checkSettings(value, template) {
    			if (value === undefined) return template;
    			if (typeof value !== "object") return value;
    			var out = {};

    			for (var key in template) {
    				if (value[key] === undefined || typeof value[key] === "undefined") {
    					out[key] = template[key];
    					continue;
    				}

    				if (typeof value[key] === "object") out[key] = checkSettings(value[key], template[key]);
    				if (typeof value[key] !== "object") out[key] = value[key];
    			}

    			return out;
    		}

    		$$invalidate(1, config = checkSettings(config, configTemplate));
    	})();

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
    		$$invalidate(2, osuData);
    	}

    	function menu_song_binding(value) {
    		songData = value;
    		$$invalidate(0, songData);
    	}

    	function menu_osuData_binding(value) {
    		osuData = value;
    		$$invalidate(2, osuData);
    	}

    	function menu_config_binding(value) {
    		config = value;
    		$$invalidate(1, config);
    	}

    	$$self.$capture_state = () => ({
    		Menu,
    		Visualizer,
    		Store,
    		store,
    		songData,
    		config,
    		osuData
    	});

    	$$self.$inject_state = $$props => {
    		if ("songData" in $$props) $$invalidate(0, songData = $$props.songData);
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    		if ("osuData" in $$props) $$invalidate(2, osuData = $$props.osuData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*config*/ 2) {
    			 store.set("config", config);
    		}
    	};

    	return [
    		songData,
    		config,
    		osuData,
    		visualizer_songData_binding,
    		visualizer_osuData_binding,
    		menu_song_binding,
    		menu_osuData_binding,
    		menu_config_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
