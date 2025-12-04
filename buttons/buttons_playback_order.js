'use strict';
//04/12/25

/*
	Playback controls
*/

include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable, MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_flags.js');
/* global PlaybackOrder:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'pre'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Order button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playback repeat': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(this, true, ['buttons_playback_repeat.js']).btn_up(this.currX, this.currY + this.currH);
			} else { this.cycle(); }
		},
		description: function () {
			let info = this.getName() + ' playback order';
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: function () {
			switch (plman.PlaybackOrder) {
				case PlaybackOrder.Default: return '\uf064';
				case PlaybackOrder.RepeatPlaylist: return '\uf079' + 'ᵖˡˢᵗ';
				case PlaybackOrder.RepeatTrack: return '\uf079' + 'ᵗʳᵃᶜᵏ';
				case PlaybackOrder.Random: return chars.shuffle;
				case PlaybackOrder.ShuffleTracks: return chars.shuffle + 'ᵗʳᵃᶜᵏˢ';
				case PlaybackOrder.ShuffleAlbums: return chars.shuffle + 'ᵃˡᵇᵘᵐˢ';
				case PlaybackOrder.ShuffleFolders: return chars.shuffle + 'ᶠᵒˡᵈᵉʳˢ';
			}
		},
		variables: {
			eventListeners: [],
			setCallbacks: function (parent, add) {
				if (add) {
					this.eventListeners.push(addEventListener('on_playback_order_changed', () => this.repaint()));
				} else {
					this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
				}
			},
			getName: function(parent, val = plman.PlaybackOrder) {
				switch (val) {
					case PlaybackOrder.Default: return 'Default';
					case PlaybackOrder.RepeatPlaylist: return'Repeat playlist';
					case PlaybackOrder.RepeatTrack: return'Repeat track';
					case PlaybackOrder.Random: return'Random';
					case PlaybackOrder.ShuffleTracks: return'Shuffle tracks';
					case PlaybackOrder.ShuffleAlbums: return'Shuffle albums';
					case PlaybackOrder.ShuffleFolders: return'Shuffle folders';
				}
			},
			cycle: function(parent, i = 1, from = plman.PlaybackOrder) {
				const values = Object.values(PlaybackOrder);
				values.rotate(values.indexOf(from) + i);
				return plman.PlaybackOrder = values[0];
			}
		},
		onInit: function () {
			this.setCallbacks(this, true);
		}
	}),
});