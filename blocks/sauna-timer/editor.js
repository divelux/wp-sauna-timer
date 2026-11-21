/*!
 * Sauna Timer Block — editor script (no build step)
 * (c) 2026 DIVELUX Inc. MIT License. https://diveluxsaunahat.com
 *
 * The block saves no markup: PHP renders <sauna-timer> on the front end, so
 * the numbers are always clamped and escaped on the server. In the editor the
 * block shows a plain summary and the controls sit in the sidebar.
 */
( function ( wp ) {
	'use strict';
	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var sprintf = wp.i18n.sprintf;
	var be = wp.blockEditor;
	var c = wp.components;

	var LIMITS = {
		rounds: { min: 1, max: 6, def: 3 },
		heat: { min: 1, max: 35, def: 10 },
		rest: { min: 1, max: 30, def: 10 },
		cooldown: { min: 0, max: 30, def: 0 }
	};

	function val( attrs, key ) {
		var v = attrs[ key ];
		return typeof v === 'number' && isFinite( v ) ? v : LIMITS[ key ].def;
	}

	function range( props, key, label, help ) {
		return el( c.RangeControl, {
			__nextHasNoMarginBottom: true,
			label: label,
			help: help,
			min: LIMITS[ key ].min,
			max: LIMITS[ key ].max,
			value: val( props.attributes, key ),
			onChange: function ( v ) {
				var o = {};
				o[ key ] = typeof v === 'number' ? v : undefined;
				props.setAttributes( o );
			}
		} );
	}

	wp.blocks.registerBlockType( 'divelux/sauna-timer', {
		edit: function ( props ) {
			var a = props.attributes;
			var rounds = val( a, 'rounds' ), heat = val( a, 'heat' ), rest = val( a, 'rest' ), cool = val( a, 'cooldown' ) || rest;
			var total = rounds * heat + ( rounds - 1 ) * rest + cool;
			var blockProps = be.useBlockProps( { className: 'wpst-editor-preview' } );
			return el( wp.element.Fragment, null,
				el( be.InspectorControls, null,
					el( c.PanelBody, { title: __( 'Session', 'wp-sauna-timer' ), initialOpen: true },
						range( props, 'rounds', __( 'Rounds in the heat', 'wp-sauna-timer' ) ),
						range( props, 'heat', __( 'Minutes per round', 'wp-sauna-timer' ) ),
						range( props, 'rest', __( 'Minutes of break between rounds', 'wp-sauna-timer' ) ),
						range( props, 'cooldown', __( 'Minutes of final cool-down', 'wp-sauna-timer' ), __( '0 = same as the break.', 'wp-sauna-timer' ) ),
						el( c.ToggleControl, {
							__nextHasNoMarginBottom: true,
							label: __( 'Start with the beep off', 'wp-sauna-timer' ),
							checked: !! a.muted,
							onChange: function ( v ) { props.setAttributes( { muted: !! v } ); }
						} ),
						el( c.TextControl, {
							__nextHasNoMarginBottom: true,
							label: __( 'Heading (optional)', 'wp-sauna-timer' ),
							value: a.heading || '',
							onChange: function ( v ) { props.setAttributes( { heading: v } ); }
						} )
					)
				),
				el( 'div', blockProps,
					el( 'p', { style: { margin: 0, fontWeight: 600 } }, a.heading || __( 'Sauna timer', 'wp-sauna-timer' ) ),
					el( 'p', { style: { margin: '4px 0 0' } },
						sprintf(
							/* translators: 1: rounds, 2: minutes per round, 3: break minutes, 4: cool-down minutes, 5: total minutes */
							__( '%1$d rounds of %2$d min, %3$d min breaks, %4$d min final cool-down. %5$d min in all.', 'wp-sauna-timer' ),
							rounds, heat, rest, cool, total
						)
					),
					el( 'p', { style: { margin: '4px 0 0', opacity: 0.7, fontSize: '13px' } },
						__( 'The working timer shows on the published page.', 'wp-sauna-timer' ) )
				)
			);
		},
		save: function () { return null; }
	} );
} )( window.wp );
