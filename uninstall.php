<?php
/**
 * Removes the plugin's one option when the plugin is deleted.
 *
 * @package WPSaunaTimer
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'wpst_defaults' );
delete_site_option( 'wpst_defaults' );
