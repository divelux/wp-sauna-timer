=== Sauna Timer Block ===
Contributors: divelux
Tags: sauna, timer, countdown, interval timer, block
Requires at least: 6.3
Tested up to: 7.1
Stable tag: 1.0.0
Requires PHP: 7.4
License: MIT
License URI: https://opensource.org/licenses/MIT

A sauna round timer for any post or page: rounds in the heat, breaks, final cool-down. A block and a [sauna_timer] shortcode. No external requests.

== Description ==

Sauna Timer Block puts a round timer for the sauna on a page: time in the heat, a break, repeat, then a final cool-down. Add it as a block, or type a shortcode anywhere shortcodes work.

* A **Sauna Timer** block with the settings in the sidebar
* A `[sauna_timer]` shortcode for classic posts, widgets and page builders
* Start, pause, skip ahead and reset; a short beep at the end of each part, which visitors can turn off
* Keeps true time: it reads the clock instead of counting ticks, so a phone that sleeps catches up
* Screen-reader friendly: real buttons, the phase changes are announced
* Sizes itself to its column, from about 240 px wide
* No external requests, no tracking, no cookies, nothing stored about visitors
* The script loads only on pages that show a timer
* One option row in the database, removed when you delete the plugin

A session always runs heat, break, heat, and so on, then a final cool-down, so it never ends in the hot room. The limits (1 to 6 rounds, 1 to 35 minutes per round, 1 to 30 minutes of break) are bounds for a timer, not advice. The timer tells visitors to step out sooner if they feel dizzy, sick or faint. Not medical advice.

The timer is the open-source `<sauna-timer>` web component, bundled inside the plugin: https://github.com/divelux/sauna-timer-element

Made by DIVELUX, a small family brand in Irvine, California that makes handmade wool sauna hats.

= Shortcode =

`[sauna_timer]` uses the defaults from Settings > Sauna Timer.

`[sauna_timer rounds="3" heat="10" rest="10" cooldown="10" muted="yes" heading="Evening session"]`

* `rounds` - rounds in the heat, 1 to 6
* `heat` - minutes per round, 1 to 35
* `rest` - minutes of break between rounds, 1 to 30
* `cooldown` - minutes of final cool-down, 1 to 30; leave it out to use the break length
* `muted` - `yes` starts with the beep off
* `heading` - a short title above the timer

Numbers outside a range are pulled back into it and junk falls back to the default, so a typo cannot break the page.

== Installation ==

1. Upload the `wp-sauna-timer` folder to `/wp-content/plugins/`, or install the zip from Plugins > Add New > Upload Plugin.
2. Activate the plugin.
3. Optional: set the site-wide defaults in Settings > Sauna Timer.
4. Add the Sauna Timer block to a page, or type `[sauna_timer]`.

== Frequently Asked Questions ==

= Does the plugin contact any outside server? =

No. The timer script ships inside the plugin and is served from your own site. There are no fonts, analytics, or calls home.

= Is there a credit link on my pages? =

Not unless you turn it on. Settings > Sauna Timer has a box for a small "Timer by DIVELUX" line under the timer. It is off by default.

= Can I change the colors? =

Yes. The timer reads CSS custom properties, for example `--sauna-timer-accent`, `--sauna-timer-bg` and `--sauna-timer-ink`. Set them on `.wpst-sauna-timer` in Appearance > Customize > Additional CSS. The full list is in the sauna-timer-element README.

= Why does the editor show a summary instead of the running timer? =

The block saves no HTML. The server renders the timer on the published page, so every number is checked and escaped there. The editor shows what the session will be.

= Does the sound play on phones? =

Browsers only play sound after a tap, so the beep starts working once the visitor presses Start. Some phones in silent mode stay silent.

== Screenshots ==

1. The timer on a published page, at phone width.

== Changelog ==

= 1.0.0 =
* First release: block, shortcode, settings page, bundled sauna-timer-element 1.0.0.

== Upgrade Notice ==

= 1.0.0 =
First release.
