'use strict';
//11/12/25

/*
	Playback controls
*/

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable, MK_SHIFT:readable, VK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'ppl'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Play button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bPlayOrPause: ['Play or Pause', true, { func: isBoolean }, true],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playback play': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_playback_play.js'], void (0),
					{
						bPlayOrPause: (value) => {
							this.setCallbacks(this, value);
						}
					}, void (0),
					{ parentName: 'Play button: ' }
				).btn_up(this.currX, this.currY + this.currH);
			} else { this.buttonsProperties.bPlayOrPause[1] ? fb.PlayOrPause() : fb.Play(); }
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			let info = this.buttonsProperties.bPlayOrPause[1]
				? fb.IsPlaying && !fb.IsPaused ? 'Pause' : 'Play'
				: 'Play';
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: function () {
			return this.buttonsProperties.bPlayOrPause[1]
				? fb.IsPlaying && !fb.IsPaused ? chars.pause : chars.play
				: chars.play;
		},
		variables: {
			eventListeners: [],
			setCallbacks: function (parent, add) {
				if (add) {
					this.eventListeners.push(addEventListener('on_playback_stop', (reason) => {
						if (reason === 0) { this.repaint(); } // Invoked by user
					}));
					this.eventListeners.push(addEventListener('on_playback_pause', () => this.repaint()));
					this.eventListeners.push(addEventListener('on_playback_starting', () => this.repaint()));
				} else {
					this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
				}
			}
		},
		onInit: function () {
			this.setCallbacks(this, this.buttonsProperties.bPlayOrPause[1]);
		}
	}),
});