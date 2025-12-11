'use strict';
//10/12/25

/*
	Playback controls
*/

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global checkCompatible:readable, MK_SHIFT:readable, VK_SHIFT:readable , globTags:readable, MK_CONTROL:readable, VK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, buttonStates:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isString:readable, isBoolean:readable, _bt:readable, isStringWeak:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable, RGB:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

var prefix = 'plo'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Playback Love button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	tag: ['Feedback tag', globTags.feedback, { func: isString }, globTags.feedback],
	bPlaying: ['Follow now playing', true, { func: isBoolean }, true],
	bEvalSel: ['Evaluate multiple tracks', false, { func: isBoolean }, false],
	favPls: ['Send to Favourites playlist', '', { func: isStringWeak }, ''],
	hatePls: ['Send to Hated playlist', '', { func: isStringWeak }, ''],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playback love': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 0, h: 22 },
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_playback_love.js'], void (0),
					{
						tag: (value) => {
							this.tf = fb.TitleFormat(_bt(value));
						},
						bEvalSel: () => {
							this.clearSelectionCache();
						}
					}
				).btn_up(this.currX, this.currY + this.currH);
			} else {
				const sel = this.getSelection();
				if (mask === MK_CONTROL) {
					this.setFeedback(-1, sel);
					if (this.isHatedAll(sel)) { this.removeFromPls(sel, this.buttonsProperties.hatePls[1]); }
					else {
						this.removeFromPls(sel, this.buttonsProperties.favPls[1]);
						this.sendToPls(sel, this.buttonsProperties.hatePls[1]);
					}
				} else {
					this.setFeedback(1, sel);
					if (this.isLovedAll(sel)) { this.removeFromPls(sel, this.buttonsProperties.favPls[1]); }
					else {
						this.removeFromPls(sel, this.buttonsProperties.hatePls[1]);
						this.sendToPls(sel, this.buttonsProperties.favPls[1]);
					}

				}
			}
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bCtrl = utils.IsKeyPressed(VK_CONTROL);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			const sel = this.getSelection();
			const tags = this.getTags(sel);
			const loved = this.countLoved(sel);
			const hated = this.countHated(sel);
			let info = bCtrl
				? this.isHatedAll(void (0), tags)
					? 'Unhate track(s)'
					: 'Hate track(s)'
				: this.isLovedAll(void (0), tags)
					? 'Unlove track(s)'
					: 'Love track(s)';
			info += '\n' + loved + ' loved / ' + hated + ' hated (' + (sel ? sel.Count : 0) + ' tracks)';
			if (bShift || bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to hate track(s))';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: function () {
			const tags = this.getTags();
			return this.isLovedSome(void (0), tags)
				? this.isLovedAll(void (0), tags) ? chars.heartOn : chars.heartHalf
				: this.isHatedSome(void (0), tags) ? chars.close : chars.heartOff;
		},
		variables: {
			colors: {
				text: (parent, state) => {
					const tags = parent.getTags();
					return parent.isLovedAll(void (0), tags)
						? [buttonStates.down, buttonStates.hover].includes(state) ? void (0) : RGB(255, 0, 0)
						: parent.isLovedSome(void (0), tags)
							? [buttonStates.down, buttonStates.hover].includes(state) ? void (0) : RGB(255, 100, 50)
							: parent.isHatedSome(void (0), tags)
								? [buttonStates.down, buttonStates.hover].includes(state) ? void (0) : RGB(255, 100, 50)
								: [buttonStates.down, buttonStates.hover].includes(state)
									? RGB(255, 0, 0) : void (0);
				}
			},
			eventListeners: [],
			setCallbacks: function (parent, add) {
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
				} else {
					this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
				}
			},
			tf: null,
			selCache: { bSorted: false, handleList: null },
			getSelection: function (parent, bSorted = true) {
				// Cache is needed since icon is refreshed on every mouse move...
				if (this.selCache.handleList && this.selCache.bSorted === bSorted) { return this.selCache.handleList; }
				const handleList = this.buttonsProperties.bPlaying[1] && fb.IsPlaying
					? new FbMetadbHandleList(fb.GetNowPlaying() || fb.GetSelection() || fb.GetFocusItem(true))
					: this.buttonsProperties.bEvalSel[1]
						? fb.GetSelections(1)
						: new FbMetadbHandleList(fb.GetSelection() || fb.GetFocusItem(true));
				if (!handleList || !handleList.Count) { return null; }
				if (handleList.Count > 1 && bSorted) { handleList.Sort(); } // Speeds up calcs if there are duplicates
				this.setSelectionCache(handleList, bSorted);
				return handleList;
			},
			clearSelectionCache: function (parent) { // eslint-disable-line no-unused-vars
				this.selCache.handleList = null;
				this.selCache.bSorted = false;
			},
			setSelectionCache: function (parent, handleList, bSorted) {
				this.selCache.handleList = handleList;
				this.selCache.bSorted = bSorted;
			},
			getTags: function (parent, handleList = this.getSelection()) {
				if (!handleList) { return []; }
				return this.tf.EvalWithMetadbs(handleList).map(Number);
			},
			isLovedSome: function (parent, handleList, tags) {
				return (tags || this.getTags(handleList)).some((val) => val === 1);
			},
			isLovedAll: function (parent, handleList, tags) {
				return (tags || this.getTags(handleList)).every((val) => val === 1);
			},
			isHatedSome: function (parent, handleList, tags) {
				return (tags || this.getTags(handleList)).some((val) => val === -1);
			},
			isHatedAll: function (parent, handleList, tags) {
				return (tags || this.getTags(handleList)).every((val) => val === -1);
			},
			countLoved: function (parent, handleList) {
				return handleList
					? fb.GetQueryItems(handleList, this.buttonsProperties.tag[1] + ' IS ' + 1).Count
					: 0;
			},
			countHated: function (parent, handleList) {
				return handleList
					? fb.GetQueryItems(handleList, this.buttonsProperties.tag[1] + ' IS ' + -1).Count
					: 0;
			},
			setFeedback: function (parent, newVal = 1, handleList = this.getSelection()) {
				if (!handleList || !handleList.Count) { return false; }
				const toTag = handleList.Clone();
				const count = handleList.Count - 1;
				this.getTags(handleList).reverse().forEach((val, i) => {
					if (val === newVal) { toTag.RemoveById(count - i); }
				});
				if (!toTag.Count) {
					handleList.UpdateFileInfoFromJSON(JSON.stringify({ [this.buttonsProperties.tag[1]]: null }));
				} else {
					toTag.UpdateFileInfoFromJSON(JSON.stringify({ [this.buttonsProperties.tag[1]]: newVal }));
				}
				return true;
			},
			sendToPls: function (parent, handleList = this.getSelection(), pls = '') {
				if (!pls || !pls.length) { return false; }
				const idx = plman.FindOrCreatePlaylist(pls, false);
				if (idx !== -1) {
					const plsItems = plman.GetPlaylistItems(idx);
					const count = plsItems.Count || 0;
					plsItems.Sort();
					const toAdd = new FbMetadbHandleList();
					new Set(handleList.Convert()).forEach((handle) => {
						if (plsItems.BSearch(handle)) { toAdd.Add(handle); };
					});
					if (toAdd.Count) { plman.InsertPlaylistItems(idx, count, toAdd); }
				}
			},
			removeFromPls: function (parent, handleList = this.getSelection(), pls = '') {
				if (!pls || !pls.length) { return false; }
				const idx = plman.FindPlaylist(pls);
				if (idx !== -1) {
					const plsItems = plman.GetPlaylistItems(idx);
					const toRemove = handleList.Clone();
					toRemove.Sort();
					const selIdx = [];
					plsItems.Convert().forEach((handle, i) => {
						if (toRemove.BSearch(handle) !== -1) { selIdx.push(i); };
					});
					if (selIdx.length) {
						plman.UndoBackup(idx);
						plman.SetPlaylistSelection(idx, selIdx, true);
						plman.RemovePlaylistSelection(idx);
					}
				}
			}
		},
		onInit: function () {
			this.setCallbacks(this, true);
			this.tf = fb.TitleFormat(_bt(this.buttonsProperties.tag[1]));
		}
	}),
});