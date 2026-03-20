'use strict';
//19/03/26

/*
	Playlist History
	----------------
	Switch to previous playlists.
 */

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _textWidth:readable, chars:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\playlist_history.js');
/* global PlsHistory:readable */

var prefix = 'ph'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Playlist Tools History', { author: 'regorxxx', features: { drag_n_drop: false } }); }

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools History': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _textWidth('Prev. Playlist', buttonsBar.config.font.text) + buttonsBar.config.buttonMargin, h: _scale(16, false) },
		text: 'Prev. Playlist',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				this.plsHistory.menu().btn_up(this.currX, this.currY + this.currH);
			} else {
				this.plsHistory.goPrevPls();
			}
		},
		description: function () {
			return 'Switch to previous playlist:' +
				'\nPlaylist:\t' + this.plsHistory.getPrevPlsName() +
				(typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1]
					? '\n-----------------------------------------------------\n(Shift + L. Click to see entire history)'
					: '');
		},
		prefix,	buttonsProperties: newButtonsProperties,
		icon: chars.history,
		variables: { plsHistory: new PlsHistory() }
	})
});