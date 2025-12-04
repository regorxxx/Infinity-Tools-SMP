'use strict';
//04/12/25

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
/* global isString:readable, isBoolean:readable, _bt:readable */
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
						}
					}
				).btn_up(this.currX, this.currY + this.currH);
			} else if (mask === MK_CONTROL) { this.setFeedback(-1); }
			else { this.setFeedback(1); }
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bCtrl = utils.IsKeyPressed(VK_CONTROL);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			let info = bCtrl
				? this.isHatedAll()
					? 'Unhate track(s)'
					: 'Hate track(s)'
				: this.isLovedAll()
					? 'Unlove track(s)'
					: 'Love track(s)';
			if (bShift || bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to hate track(s))';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: function () {
			const sel = this.getSelection();
			return this.isLovedSome(sel)
				? this.isLovedAll(sel) ? chars.heartOn : chars.heartHalf
				: this.isHatedSome() ? chars.close : chars.heartOff;
		},
		variables: {
			colors: {
				text: (parent, state) => {
					return parent.isLovedAll()
						? [buttonStates.down, buttonStates.hover].includes(state) ? void(0) : RGB(255, 0, 0)
						: parent.isLovedSome()
							? [buttonStates.down, buttonStates.hover].includes(state) ? void(0) : RGB(255, 100, 50)
							: parent.isHatedSome()
								? [buttonStates.down, buttonStates.hover].includes(state) ? void(0) : RGB(255, 100, 50)
								: void(0);
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
						this.repaint();
					}));
				} else {
					this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
				}
			},
			tf: null,
			getSelection: function () {
				const handleList = this.buttonsProperties.bPlaying[1] && fb.IsPlaying
					? new FbMetadbHandleList(fb.GetNowPlaying() || fb.GetFocusItem(true))
					: fb.GetSelections(1);
				if (!handleList || !handleList.Count) { return null; }
				return handleList;
			},
			getTags: function (parent, handleList = this.getSelection()) {
				if (!handleList) { return []; }
				return this.tf.EvalWithMetadbs(handleList).map(Number);
			},
			isLovedSome: function (parent, handleList) {
				return this.getTags(void (0), handleList).some((val) => val === 1);
			},
			isLovedAll: function (parent, handleList) {
				return this.getTags(void (0), handleList).every((val) => val === 1);
			},
			isHatedSome: function (parent, handleList) {
				return this.getTags(void (0), handleList).some((val) => val === -1);
			},
			isHatedAll: function (parent, handleList) {
				return this.getTags(void (0), handleList).every((val) => val === -1);
			},
			setFeedback: function (parent, newVal = 1, handleList = this.getSelection()) {
				if (!handleList || !handleList.Count) { return false; }
				const toTag = handleList.Clone();
				const count = handleList.Count - 1;
				this.getTags(void (0), handleList).reverse().forEach((val, i) => {
					if (val === newVal) { toTag.RemoveById(count - i); }
				});
				if (!toTag.Count) {
					handleList.UpdateFileInfoFromJSON(JSON.stringify({ [this.buttonsProperties.tag[1]]: null }));
				} else {
					toTag.UpdateFileInfoFromJSON(JSON.stringify({ [this.buttonsProperties.tag[1]]: newVal }));
				}
				return true;
			}
		},
		onInit: function () {
			this.setCallbacks(this, true);
			this.tf = fb.TitleFormat(_bt(this.buttonsProperties.tag[1]));
		}
	}),
});