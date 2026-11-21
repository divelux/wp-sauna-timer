<?php
/**
 * Plugin Name:       Sauna Timer Block
 * Plugin URI:        https://github.com/divelux/wp-sauna-timer
 * Description:       A sauna round timer for posts and pages: time in the heat, a break, repeat, final cool-down. A block and a [sauna_timer] shortcode. No external requests.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            DIVELUX
 * Author URI:        https://diveluxsaunahat.com
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       wp-sauna-timer
 *
 * @package WPSaunaTimer
 *
 * (c) 2026 DIVELUX Inc. MIT License.
 * The timer itself is the <sauna-timer> custom element from
 * https://github.com/divelux/sauna-timer-element, bundled in assets/.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WPST_VERSION', '1.0.0' );
define( 'WPST_OPTION', 'wpst_defaults' );

/**
 * Bounds of the timer. The same as LIMITS in sauna-timer.js. These are bounds
 * for a timer, not advice.
 *
 * @return array<string, array{min:int, max:int, def:int}>
 */
function wpst_limits() {
	return array(
		'rounds'   => array( 'min' => 1, 'max' => 6, 'def' => 3 ),
		'heat'     => array( 'min' => 1, 'max' => 35, 'def' => 10 ),
		'rest'     => array( 'min' => 1, 'max' => 30, 'def' => 10 ),
		'cooldown' => array( 'min' => 0, 'max' => 30, 'def' => 0 ), // 0 = same as the break.
	);
}

/**
 * Clamp any value to a whole number inside a range; junk gives the fallback.
 *
 * @param mixed $value    Raw value.
 * @param int   $min      Lowest allowed.
 * @param int   $max      Highest allowed.
 * @param int   $fallback Used when $value is not a number.
 * @return int
 */
function wpst_clamp( $value, $min, $max, $fallback ) {
	if ( is_bool( $value ) || ! is_numeric( $value ) ) {
		return (int) $fallback;
	}
	$n = (int) round( (float) $value );
	return max( (int) $min, min( (int) $max, $n ) );
}

/**
 * Site-wide defaults from Settings > Sauna Timer, cleaned.
 *
 * @return array{rounds:int, heat:int, rest:int, cooldown:int, muted:bool, credit:bool}
 */
function wpst_defaults() {
	$saved = get_option( WPST_OPTION, array() );
	return wpst_sanitize_defaults( is_array( $saved ) ? $saved : array() );
}

/**
 * Sanitize callback of the settings (register_setting) and of stored values.
 *
 * @param mixed $input Raw option value.
 * @return array{rounds:int, heat:int, rest:int, cooldown:int, muted:bool, credit:bool}
 */
function wpst_sanitize_defaults( $input ) {
	$input = is_array( $input ) ? $input : array();
	$l     = wpst_limits();
	$out   = array();
	foreach ( array( 'rounds', 'heat', 'rest', 'cooldown' ) as $key ) {
		$out[ $key ] = wpst_clamp( isset( $input[ $key ] ) ? $input[ $key ] : null, $l[ $key ]['min'], $l[ $key ]['max'], $l[ $key ]['def'] );
	}
	$out['muted']  = ! empty( $input['muted'] );
	// Off unless the site owner opts in (WordPress.org guideline 10).
	$out['credit'] = ! empty( $input['credit'] );
	return $out;
}

/**
 * Register the timer script. It is enqueued only when a timer is rendered.
 */
function wpst_register_assets() {
	wp_register_script(
		'wpst-sauna-timer',
		plugins_url( 'assets/sauna-timer.iife.js', __FILE__ ),
		array(),
		WPST_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);
	wp_register_script(
		'wpst-block-editor',
		plugins_url( 'blocks/sauna-timer/editor.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
		WPST_VERSION,
		true
	);
	register_block_type(
		__DIR__ . '/blocks/sauna-timer',
		array( 'render_callback' => 'wpst_render_block' )
	);
}
add_action( 'init', 'wpst_register_assets' );

/**
 * Build the <sauna-timer> tag. Every value is clamped to an integer or escaped.
 *
 * @param array $args rounds, heat, rest, cooldown, muted, heading (raw).
 * @return string HTML.
 */
function wpst_markup( $args ) {
	$d = wpst_defaults();
	$l = wpst_limits();

	$rounds   = wpst_clamp( isset( $args['rounds'] ) ? $args['rounds'] : null, $l['rounds']['min'], $l['rounds']['max'], $d['rounds'] );
	$heat     = wpst_clamp( isset( $args['heat'] ) ? $args['heat'] : null, $l['heat']['min'], $l['heat']['max'], $d['heat'] );
	$rest     = wpst_clamp( isset( $args['rest'] ) ? $args['rest'] : null, $l['rest']['min'], $l['rest']['max'], $d['rest'] );
	$cooldown = wpst_clamp( isset( $args['cooldown'] ) ? $args['cooldown'] : null, $l['cooldown']['min'], $l['cooldown']['max'], $d['cooldown'] );

	if ( isset( $args['muted'] ) && '' !== $args['muted'] && null !== $args['muted'] ) {
		$muted = in_array( strtolower( (string) $args['muted'] ), array( '1', 'yes', 'true', 'on' ), true ) || true === $args['muted'];
	} else {
		$muted = $d['muted'];
	}
	$heading = isset( $args['heading'] ) ? sanitize_text_field( (string) $args['heading'] ) : '';

	wp_enqueue_script( 'wpst-sauna-timer' );

	$attrs  = ' rounds="' . absint( $rounds ) . '"';
	$attrs .= ' heat="' . absint( $heat ) . '"';
	$attrs .= ' rest="' . absint( $rest ) . '"';
	if ( $cooldown > 0 ) {
		$attrs .= ' cooldown="' . absint( $cooldown ) . '"';
	}
	if ( $muted ) {
		$attrs .= ' muted';
	}
	if ( '' !== $heading ) {
		$attrs .= ' heading="' . esc_attr( $heading ) . '"';
	}
	if ( ! $d['credit'] ) {
		$attrs .= ' credit="off"';
	}

	$fallback = sprintf(
		/* translators: 1: rounds, 2: minutes in the heat, 3: minutes of break. */
		esc_html__( 'Sauna timer: %1$d rounds of %2$d minutes with %3$d-minute breaks. It needs JavaScript.', 'wp-sauna-timer' ),
		absint( $rounds ),
		absint( $heat ),
		absint( $rest )
	);

	return '<div class="wpst-sauna-timer"><sauna-timer' . $attrs . '><p>' . $fallback . '</p></sauna-timer></div>';
}

/**
 * [sauna_timer rounds="3" heat="10" rest="10" cooldown="10" muted="yes" heading="Evening session"]
 *
 * @param array|string $atts Shortcode attributes.
 * @return string
 */
function wpst_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'rounds'   => null,
			'heat'     => null,
			'rest'     => null,
			'cooldown' => null,
			'muted'    => null,
			'heading'  => '',
		),
		is_array( $atts ) ? $atts : array(),
		'sauna_timer'
	);
	return wpst_markup( $atts );
}
add_shortcode( 'sauna_timer', 'wpst_shortcode' );

/**
 * Server render of the block. The block saves no HTML of its own.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function wpst_render_block( $attributes ) {
	$attributes = is_array( $attributes ) ? $attributes : array();
	$html       = wpst_markup(
		array(
			'rounds'   => isset( $attributes['rounds'] ) ? $attributes['rounds'] : null,
			'heat'     => isset( $attributes['heat'] ) ? $attributes['heat'] : null,
			'rest'     => isset( $attributes['rest'] ) ? $attributes['rest'] : null,
			'cooldown' => isset( $attributes['cooldown'] ) ? $attributes['cooldown'] : null,
			'muted'    => isset( $attributes['muted'] ) ? ( $attributes['muted'] ? 'yes' : 'no' ) : null,
			'heading'  => isset( $attributes['heading'] ) ? $attributes['heading'] : '',
		)
	);
	$wrapper    = function_exists( 'get_block_wrapper_attributes' ) ? get_block_wrapper_attributes() : '';
	return '<div ' . $wrapper . '>' . $html . '</div>';
}

/* ---------- Settings > Sauna Timer ---------- */

/**
 * Register the option with the Settings API. options.php checks the nonce
 * that settings_fields() prints, and the manage_options capability.
 */
function wpst_register_settings() {
	register_setting(
		'wpst_settings',
		WPST_OPTION,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'wpst_sanitize_defaults',
			'default'           => wpst_sanitize_defaults( array() ),
			'show_in_rest'      => false,
		)
	);
}
add_action( 'admin_init', 'wpst_register_settings' );

/**
 * Add the page under Settings.
 */
function wpst_admin_menu() {
	add_options_page(
		__( 'Sauna Timer', 'wp-sauna-timer' ),
		__( 'Sauna Timer', 'wp-sauna-timer' ),
		'manage_options',
		'wpst-settings',
		'wpst_settings_page'
	);
}
add_action( 'admin_menu', 'wpst_admin_menu' );

/**
 * Settings page.
 */
function wpst_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$d = wpst_defaults();
	$l = wpst_limits();

	$rows = array(
		'rounds'   => __( 'Rounds in the heat', 'wp-sauna-timer' ),
		'heat'     => __( 'Minutes per round', 'wp-sauna-timer' ),
		'rest'     => __( 'Minutes of break between rounds', 'wp-sauna-timer' ),
		'cooldown' => __( 'Minutes of final cool-down (0 = same as the break)', 'wp-sauna-timer' ),
	);
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<p><?php esc_html_e( 'Defaults for every timer on the site. A block or a shortcode can still set its own numbers.', 'wp-sauna-timer' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( 'wpst_settings' ); ?>
			<table class="form-table" role="presentation">
				<?php foreach ( $rows as $key => $label ) : ?>
					<tr>
						<th scope="row"><label for="wpst-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
						<td>
							<input type="number" class="small-text" id="wpst-<?php echo esc_attr( $key ); ?>"
								name="<?php echo esc_attr( WPST_OPTION . '[' . $key . ']' ); ?>"
								min="<?php echo esc_attr( $l[ $key ]['min'] ); ?>" max="<?php echo esc_attr( $l[ $key ]['max'] ); ?>" step="1"
								value="<?php echo esc_attr( $d[ $key ] ); ?>">
						</td>
					</tr>
				<?php endforeach; ?>
				<tr>
					<th scope="row"><?php esc_html_e( 'Sound', 'wp-sauna-timer' ); ?></th>
					<td><label><input type="checkbox" name="<?php echo esc_attr( WPST_OPTION . '[muted]' ); ?>" value="1" <?php checked( $d['muted'] ); ?>>
						<?php esc_html_e( 'Start with the beep turned off (visitors can turn it on)', 'wp-sauna-timer' ); ?></label></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Credit line', 'wp-sauna-timer' ); ?></th>
					<td><label><input type="checkbox" name="<?php echo esc_attr( WPST_OPTION . '[credit]' ); ?>" value="1" <?php checked( $d['credit'] ); ?>>
						<?php esc_html_e( 'Show a small "Timer by DIVELUX" link under the timer (off by default)', 'wp-sauna-timer' ); ?></label></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<h2><?php esc_html_e( 'Shortcode', 'wp-sauna-timer' ); ?></h2>
		<p><code>[sauna_timer rounds="3" heat="10" rest="10" cooldown="10" muted="yes" heading="Evening session"]</code></p>
		<p><?php esc_html_e( 'The limits are bounds for a timer, not advice. The timer tells visitors to step out sooner if they feel dizzy, sick or faint. Not medical advice.', 'wp-sauna-timer' ); ?></p>
	</div>
	<?php
}

/**
 * "Settings" link on the Plugins screen.
 *
 * @param array $links Action links.
 * @return array
 */
function wpst_action_links( $links ) {
	$url = admin_url( 'options-general.php?page=wpst-settings' );
	array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'wp-sauna-timer' ) . '</a>' );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'wpst_action_links' );
