'use strict';
//22/05/26

/*
	Playback controls
*/

include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable */
include('..\\helpers\\buttons_xxx.js');
/* global buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable, _scale:readable */

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Random button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible();

buttonsBar.list.push({});

addButton({
	'Playback random': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: _scale(16, false) },
		func: function () {
			fb.Random();
		},
		description: 'Random',
		icon: chars.shuffle
	}),
});