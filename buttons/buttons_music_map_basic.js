'use strict';
//08/11/26

include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
/* global barProperties:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx.js');
/* global MK_SHIFT:readable, VK_SHIFT:readable, globRegExp:readable, doOnce:readable, debounce:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, _p:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _textWidth:readable, chars:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global SearchByDistance_properties:readable, sbd:readable, updateCache:readable, findStyleGenresMissingGraphCheck:readable, testBaseTags:readable, checkJsonProperties:readable, searchByDistance:readable */
include('helpers\\buttons_sbd_menu_presets.js'); // Button menu
/* global choosePresetMenu:readable */

if (!window.ScriptInfo.Name) { window.DefineScript(sbd.name + ' Basic Buttons', { author: 'regorxxx', features: { drag_n_drop: false } }); }

var prefix = 'sbd'; // NOSONAR[global]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
newButtonsProperties = { ...SearchByDistance_properties, ...newButtonsProperties }; // Add default properties at the beginning to be sure they work
delete newButtonsProperties.probPick;
delete newButtonsProperties.minScoreFilter;
delete newButtonsProperties.scoreFilter;
delete newButtonsProperties.graphDistance;
delete newButtonsProperties.bSameArtistFilter;
delete newButtonsProperties.bRandomPick;
delete newButtonsProperties.bInversePick;
delete newButtonsProperties.bSortRandom;
delete newButtonsProperties.bInverseListOrder;
delete newButtonsProperties.bProgressiveListOrder;
delete newButtonsProperties.bUseAntiInfluencesFilter;
delete newButtonsProperties.bConditionAntiInfluences;
delete newButtonsProperties.bUseInfluencesFilter;
delete newButtonsProperties.bSimilArtistsFilter;
delete newButtonsProperties.poolFilteringTag;
delete newButtonsProperties.poolFilteringN;
delete newButtonsProperties.bProgressiveListCreation;
delete newButtonsProperties.progressiveListCreationN;
delete newButtonsProperties.bHarmonicMixDoublePass;
delete newButtonsProperties.bAscii;
delete newButtonsProperties.bAdvTitle;
delete newButtonsProperties.sortBias;
delete newButtonsProperties.artistRegionFilter;
delete newButtonsProperties.genreStyleRegionFilter;
delete newButtonsProperties.dynQueries;
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
{
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	checkJsonProperties(properties);
	newButtonsProperties = properties;
	buttonsBar.list.push(properties);
	// Update cache with user set tags
	doOnce('Update SBD cache', debounce(updateCache, 3000))({ properties });
	// Make the user check their tags before use...
	if (!sbd.panelProperties.firstPopup[1]) {
		doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(properties);
	}
	// Test tags
	testBaseTags(JSON.parse(newButtonsProperties.tags[1]));
}

/*
	Some button examples for 'search_by_distance.js'. Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling searchByDistance() outside buttons, it would work with default arguments.
*/

addButton({
	[sbd.name + ' basic']: new ThemedButton({
		coordinates: { x: 0, y: 0, w: _textWidth('Similar Tracks', buttonsBar.config.font.text) + buttonsBar.config.buttonMargin, h: _scale(16, false) },
		text: 'Similar Tracks',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(this, true, ['buttons_music_map_basic.js'], { bAdvTitle: { popup: globRegExp.title.desc } }, void (0), void (0), { parentName: sbd.name + ': ' }).btn_up(this.currX, this.currY + this.currH);
			} else {
				choosePresetMenu(this).btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: buttonTooltipSbd,
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.wand,
		listener: {
			'on_notify_data': async (parent, name, info) => {
				if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') { return; }
				if (!name.startsWith(sbd.name)) { return; }
				switch (name) { // NOSONAR
					case sbd.name + ': search by distance': {
						if (!info) { break; }
						if (info.window) {
							if (!info.window.includes(window.Name)) { break; }
							info.window.splice(info.window.indexOf(window.Name), 1);
						}
						const targetId = Object.hasOwn(info, 'id') ? info.id : null;
						const options = {
							sel: info.sel || (info.handleList ? new FbMetadbHandleList(info.handleList) : void (0)),
							theme: Object.hasOwn(info, 'theme') ? JSON.parse(JSON.stringify(info.theme)) : null,
							recipe: Object.hasOwn(info, 'recipe') ? info.recipe || 'ext_simil_tracks_graph.json' : null,
							bCreatePlaylist: Object.hasOwn(info, 'bCreatePlaylist') ? info.bCreatePlaylist : false,
							bOutputHandleList: !!targetId,
							bProfile: false,
							bShowQuery: false,
							bBasicLogging: false,
							bSearchDebug: false,
							bShowFinalSelection: true
						};
						const data = await searchByDistance({ properties: parent.buttonsProperties, parent, ...options });
						if (targetId) { window.NotifyOthers(sbd.name + ': search by distance receive', { targetId, sourceName: window.Name, data }); }
						break;
					}
				}
			}
		},
	})
});

// Helper
function buttonTooltipSbd() {
	let info = 'Search similar tracks by acoustic-folksonomy models:';
	info += '\nMethod:\t' + this.buttonsProperties.method[1];
	const sort = (
		(this.buttonsProperties.bSmartShuffle[1] ? 'Smart Shuffle' : '')
		|| (this.buttonsProperties.bInKeyMixingPlaylist[1] ? 'Harmonic Mix' : '')
		|| ('Random sorting')
	);
	info += sort ? '   ' + _p(sort) : '';
	info += '\nTracks:\t' + this.buttonsProperties.playlistLength[1];
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
	if (bShift || bInfo) {
		info += '\n-----------------------------------------------------';
		info += '\n(Shift + L. Click to open config menu)';
	}
	return info;
}