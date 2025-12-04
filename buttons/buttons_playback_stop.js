'use strict';
//03/12/25

/*
	Playback controls
*/

include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable */
include('..\\helpers\\buttons_xxx.js');
/* global buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable */

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Stop button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

buttonsBar.list.push({});

addButton({
	'Playback stop': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function () {
			if (fb.IsPlaying) { fb.Stop(); }
		},
		description: 'Stop',
		icon: chars.stop
	}),
});