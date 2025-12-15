'use strict';
//15/12/25

/*
	Playback controls
*/

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable, MK_SHIFT:readable, VK_SHIFT:readable , globTags:readable, MK_CONTROL:readable, VK_CONTROL:readable, isPlayCount:readable, isPlayCount2003:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, buttonStates:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_file.js');
/* global _jsonParse:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isInt:readable, _bt:readable, _t:readable, isJSON:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global  RGB:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'pra'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Rating button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	tag: ['Rating tag: auto (0), playcount (1), playcount_2003 (2)', 0, { func: isInt, range: [[0, 2]] }, 0],
	bPlaying: ['Follow now playing', true, { func: isBoolean }, true],
	bEvalSel: ['Evaluate multiple tracks', false, { func: isBoolean }, false],
	colors: ['Matched rating colors', JSON.stringify([RGB(96, 63, 23), RGB(160, 96, 37), RGB(221, 165, 49), RGB(112, 174, 81), RGB(0, 150, 0)])],
	colorsPartial: ['Partially matched rating colors', JSON.stringify([RGB(96, 23, 23), RGB(180, 56, 37), RGB(241, 125, 49), RGB(112, 134, 81), RGB(0, 110, 0)])],
	totalRating: ['Number of stars', 5, { func: isInt }, 5]
};
newButtonsProperties.colors.push({ func: isJSON }, newButtonsProperties.colors[1]);
newButtonsProperties.colorsPartial.push({ func: isJSON }, newButtonsProperties.colorsPartial[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

{
	// Global
	const Rating = {
		properties: newButtonsProperties,
		buttons: [],
		eventListeners: [],
		setCallbacks: function (add) {
			if (add) {
				this.eventListeners.push(addEventListener('on_metadb_changed', (handleList) => {
					const sel = this.getSelection();
					if (!sel) { return false; }
					sel.Sort();
					sel.MakeIntersection(handleList);
					if (sel.Count) { this.repaint(); }
				}));
				this.eventListeners.push(addEventListener('on_selection_changed', () => {
					this.clearSelectionCache();
					this.getSelection();
					this.repaint();
				}));
				this.eventListeners.push(addEventListener('on_playback_stop', () => {
					if (this.properties.bPlaying[1]) {
						this.clearSelectionCache();
						this.repaint();
					}
				}));
			} else {
				this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
			}
		},
		colors: _jsonParse(newButtonsProperties.colors[1]) || [],
		colorsPartial: _jsonParse(newButtonsProperties.colorsPartial[1]) || [],
		tf: null,
		selCache: { bSorted: false, handleList: null },
		getSelection: function (bSorted = true) {
			// Cache is needed since icon is refreshed on every mouse move...
			if (this.selCache.handleList && this.selCache.bSorted === bSorted) { return this.selCache.handleList; }
			const handleList = this.properties.bPlaying[1] && fb.IsPlaying
				? new FbMetadbHandleList(fb.GetNowPlaying() || fb.GetSelection() || fb.GetFocusItem(true))
				: this.properties.bEvalSel[1]
					? fb.GetSelections(1)
					: new FbMetadbHandleList(fb.GetSelection() || fb.GetFocusItem(true));
			if (!handleList || !handleList.Count) { return null; }
			if (handleList.Count > 1 && bSorted) { handleList.Sort(); } // Speeds up calcs if there are duplicates
			this.setSelectionCache(handleList, bSorted);
			return handleList;
		},
		clearSelectionCache: function () { // eslint-disable-line no-unused-vars
			this.selCache.handleList = null;
			this.selCache.bSorted = false;
		},
		setSelectionCache: function (handleList, bSorted) {
			this.selCache.handleList = handleList;
			this.selCache.bSorted = bSorted;
		},
		getTags: function (handleList = this.getSelection()) {
			if (!handleList) { return []; }
			return this.tf.EvalWithMetadbs(handleList).map(Number);
		},
		getTag: function () {
			switch (this.properties.tag[1]) {
				case 2: return '%RATING_2003%';
				case 1: return '%RATING%';
				case 0:
				default: {
					if (isPlayCount) { return '%RATING%'; }
					else if (isPlayCount2003) { return '%RATING_2003%'; }
					else { return _t(globTags.rating); }
				}
			}
		},
		isRatedSome: function (handleList, tags, i) {
			return (tags || this.getTags(handleList)).some((val) => val >= (i + 1));
		},
		isRatedAll: function (handleList, tags, i) {
			return (tags || this.getTags(handleList)).every((val) => val >= (i + 1));
		},
		getMaxRating: function (handleList, tags) {
			tags = tags || this.getTags(handleList);
			let max = 0;
			for (let val of tags) {
				if (val === 5) { return 5; }
				else if (val > max) { max = val; }
			}
			return max;
		},
		countRated: function (handleList, i) {
			return handleList
				? fb.GetQueryItems(handleList, this.getTag() + ' GREATER ' + i).Count
				: 0;
		},
		setRating: function (newVal, handleList = this.getSelection()) {
			if (!handleList || !handleList.Count) { return false; }
			if (newVal === 0) { return this.resetRating(handleList); }
			switch (this.properties.tag[1]) {
				case 2: fb.RunContextCommandWithMetadb('Playcount 2003/Rating/Set Rating to ' + newVal, handleList, 8); break;
				case 1: fb.RunContextCommandWithMetadb('Playback Statistics/Rating/' + newVal, handleList, 8); break;
				case 0:
				default: {
					if (isPlayCount) { fb.RunContextCommandWithMetadb('Playback Statistics/Rating/' + newVal, handleList, 8); }
					else if (isPlayCount2003) { fb.RunContextCommandWithMetadb('Playcount 2003/Rating/Set Rating to ' + newVal, handleList, 8); }
					else { handleList.UpdateFileInfoFromJSON(JSON.stringify({ [this.getTag().replaceAll('%', '')]: newVal })); }
					break;
				}
			}
			return true;
		},
		resetRating: function (handleList = this.getSelection()) {
			if (!handleList || !handleList.Count) { return false; }
			switch (this.properties.tag[1]) {
				case 2: fb.RunContextCommandWithMetadb('Playcount 2003/Rating/Clear', handleList, 8); break;
				case 1: fb.RunContextCommandWithMetadb('Playback Statistics/Rating/<not set>', handleList, 8); break;
				case 0:
				default: {
					if (isPlayCount) { fb.RunContextCommandWithMetadb('Playback Statistics/Rating/<not set>', handleList, 8); }
					else if (isPlayCount2003) { fb.RunContextCommandWithMetadb('Playcount 2003/Rating/Clear', handleList, 8); }
					else { handleList.UpdateFileInfoFromJSON(JSON.stringify({ [this.getTag().replaceAll('%', '')]: null })); }
					break;
				}
			}
			return true;
		},
		repaint: function () {
			this.buttons.forEach((button) => button.repaint());
		}
	};
	Rating.setCallbacks(true);
	Rating.tf = fb.TitleFormat(_bt(Rating.getTag()));
	// Buttons
	for (let i = 0; i < newButtonsProperties.totalRating[1]; i++) {
		const button = new ThemedButton({
			coordinates: { x: 0, y: 0, w: 0, h: 22 },
			func: function (mask) {
				if (mask === MK_SHIFT) {
					settingsMenu(
						this, true, ['buttons_playback_rating.js'],
						{
							tag: {
								name: 'Rating tag mode',
								input: 'Enter mode:\n\n0: automatic\n1: foo_playcount\n2: foo_playcount_2003'
							},
							colors: {
								input: 'Enter colors:\n(Array of colors)'
							},
							colorsPartial: {
								input: 'Enter colors:\n(Array of colors)'
							},
						},
						{
							tag: () => {
								Rating.tf = fb.TitleFormat(_bt(Rating.getTag()));
							},
							bPlaying: () => {
								Rating.clearSelectionCache();
								Rating.repaint();
							},
							bEvalSel: () => {
								Rating.clearSelectionCache();
								Rating.repaint();
							},
							colors: (val) => {
								Rating.colors = JSON.parse(val);
							},
							colorsPartial: (val) => {
								Rating.colorsPartial = JSON.parse(val);
							},
							totalRating: () => {
								window.Reload();
							}
						},
						void (0),
						{ parentName: 'Rating button: ' }
					).btn_up(this.currX, this.currY + this.currH);
				} else {
					const sel = Rating.getSelection();
					if (mask === MK_CONTROL) { Rating.setRating(0, sel); }
					else { Rating.setRating(i + 1, sel); }
				}
			},
			description: function () {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				const bCtrl = utils.IsKeyPressed(VK_CONTROL);
				const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
				const sel = Rating.getSelection();
				const rated = Rating.countRated(sel, i);
				let info = 'Rate track(s)';
				info += '\n' + rated + ' tracks ≥' + (i + 1) + ' (' + (sel ? sel.Count : 0) + ' selected tracks)';
				if (bShift || bCtrl || bInfo) {
					info += '\n-----------------------------------------------------';
					info += '\n(Ctrl + L. Click to reset rating)';
					info += '\n(Shift + L. Click to open config menu)';
				}
				return info;
			},
			prefix, buttonsProperties: newButtonsProperties,
			icon: function () {
				const tags = Rating.getTags();
				return Rating.isRatedSome(void (0), tags, i)
					? Rating.isRatedAll(void (0), tags, i) ? '\uf005' : '\uf123'
					: '\uf006';
			},
			variables: {
				colors: {
					text: (parent, state) => {
						const tags = Rating.getTags();
						return Rating.isRatedAll(void (0), tags, i)
							? [buttonStates.down, buttonStates.hover].includes(state) ? void (0) : Rating.colors[Rating.getMaxRating(void (0), tags) - 1]
							: Rating.isRatedSome(void (0), tags, i)
								? [buttonStates.down, buttonStates.hover].includes(state) ? void (0) : Rating.colorsPartial[Rating.getMaxRating(void (0), tags) - 1]
								: [buttonStates.hover].includes(state)
									? Rating.colors[i]
									: void (0);
					}
				},
			}
		});
		addButton({ ['Playback rating ' + i]: button });
		Rating.buttons.push(button);
	}
}