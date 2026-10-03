'use strict';
//02/10/26

/*
	Search tracks on library matching given tags
	Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and works with multiple selection without a query length limit my using a tag-hash map
 */

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, MF_STRING:readable, MF_GRAYED:readable, VK_CONTROL:readable */
/* global _jsonParse:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _textWidth:readable, chars:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable, checkJsonProperties:readable */
include('..\\helpers\\helpers_xxx_playlists.js');
/* global getSource:readable, getPlaylistIndexArray:readable, selectTracksAtPlaylist:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\main\\bio\\bio_tags.js');
/* global lastfmListeners:readable */
include('..\\main\\filter_and_query\\filter_by_tag.js');
/* global matchTags:readable, matchTagsProcess:readable */
include('..\\main\\main_menu\\main_menu_custom.js');
/* global bindDynamicMenus:readable, deleteMainMenuDynamic:readable */

var prefix = 'sm'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Quicklookup button', { author: 'regorxxx', features: { drag_n_drop: false } }); }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	playlistName: ['Playlist name', '🔍 %1: %2', { func: isString }, '🔍 %1: %2'],
	lastLookup: ['Last lookup used', '', { func: isStringWeak }, ''],
	entries: ['Quicklookup entries', JSON.stringify([
		{
			name: 'By Artist',
			tfFrom: ['ARTIST']
		},
		{
			name: 'By Album Artist',
			tfFrom: ['ALBUM ARTIST']
		},
		{
			name: 'By Track ID',
			tfFrom: ['MUSICBRAINZ_TRACKID']
		},
		{
			name: 'By MD5 (tag)',
			tfFrom: ['MD5']
		},
		{
			name: 'By AUDIOMD5|Album (tag)',
			tfFrom: ['AUDIOMD5', 'ALBUM']
		},
		{
			name: 'By MD5|Album (info)',
			tfFrom: ['$info(MD5)', 'ALBUM']
		},
	]), { func: isJSON }],
	sortTF: ['Sorting TF expression', globTags.artist + '|%ALBUM%|%TRACK%', { func: isStringWeak }, globTags.artist + '|%ALBUM%|%TRACK%'],
	bDynamicMenus: ['Menus at  \'File\\Spider Monkey Panel\\...\'', false, { func: isBoolean }, false],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
checkJsonProperties(newButtonsProperties);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Quicklookup': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _textWidth('Quicklookup', buttonsBar.config.font.text) + buttonsBar.config.buttonMargin, h: _scale(16, false) },
		text: 'Quicklookup',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(
					this, true, ['buttons_search_quicklookup.js'],
					{
						lastLookup: { bHide: true },
						bDynamicMenus:
							{ popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)' },
						entries: { bHide: true },
						playlistName: { input: 'Enter output playlist:\n\n%1 will be replaced with entry name. i.e. "By MD5"\n%2 will be replaced with tag value. i.e. "D042AEB1A2DBC363360C6F51A032B60C"\n\nFor ex: 🔍 %1: %2\t--->\t🔍 By MD5: D042AEB1A2DBC363360C6F51A032B60C\n\nGenerated names have a length limit to not overflow UI.' }
					},
					{
						bDynamicMenus:
							(value) => {
								if (value) {
									bindDynamicMenus({
										menu: quicklookupMenu.bind(this),
										parentName: 'Quicklookup',
										entryCallback: (entry) => {
											const prefix = 'Quicklookup: ';
											return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
										}
									});
								} else { deleteMainMenuDynamic('Quicklookup'); }
							}
					},
					(menu) => {
						menu.newSeparator();
						_createSubMenuEditEntries(menu, void (0), {
							name: 'Quicklookup',
							list: JSON.parse(this.buttonsProperties.entries[1]),
							defaults: JSON.parse(this.buttonsProperties.entries[3]),
							input: () => {
								const entry = {};
								entry.tfFrom = Input.json('array strings', [],
									'Enter tag names:\n(JSON strings array)\n\n' +
									'Ex:\n' + JSON.stringify(['ARTIST', 'ALBUM ARTIST'])
									, 'Quicklookup: Selection tags', JSON.stringify(['ARTIST', 'ALBUM ARTIST']), [(array) => array.length !== 0], true) || (Input.isLastEqual ? Input.lastInput : null);
								if (!entry.tfFrom) { return; }
								entry.tfTo = Input.json('array strings', [],
									'Enter tag names:\n(JSON strings array)\n\n' +
									'To use same tags than selection, leave it empty ([]).\n' +
									'Ex:\n' + JSON.stringify(['ARTIST', 'ALBUM ARTIST'])
									, 'Quicklookup: Source tags', JSON.stringify([]), void (0), true) || (Input.isLastEqual ? Input.lastInput : null);
								if (!entry.tfTo) { return; }
								if (!entry.tfTo.length) { delete entry.tfTo; }
								return entry;
							},
							bNumbered: true,
							onBtnUp: (entries) => {
								this.buttonsProperties.entries[1] = JSON.stringify(entries);
								overwriteProperties(this.buttonsProperties);
							}
						});
					},
					{ parentName: 'Quicklookup: ' }
				);
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				quicklookupMenu.call(this).btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			const selMul = fb.GetSelections(1);
			let info = 'No track selected\nSome menus disabled';
			if (selMul && selMul.Count) {
				const infoMul = selMul.Count > 1 ? ' (multiple tracks selected: ' + selMul.Count + ')' : '';
				let tfo = fb.TitleFormat(
					'$puts(info,' + globTags.artist + ' / %TRACK% - %TITLE%)' +
					'Current track:	$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))'
				);
				info = 'Playlist:		' + (plman.ActivePlaylist !== -1 && fb.GetSelectionType(1) ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-') + infoMul + '\n';
				info += tfo.EvalWithMetadb(selMul[0]);
			}
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.search,
		variables: { bioSelectionMode: 'Prefer nowplaying', bioTags: {} },
		onInit: function () {
			// Create dynamic menus
			if (this.buttonsProperties.bDynamicMenus[1]) {
				bindDynamicMenus({
					menu: quicklookupMenu.bind({ buttonsProperties: this.buttonsProperties, prefix: '' }),
					parentName: 'Quicklookup',
					entryCallback: (entry) => {
						const prefix = 'Quicklookup: ';
						return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
					}
				});
			}
		},
		listener: lastfmListeners
	}),
});

function quicklookupMenu({ bSimulate = false } = {}) {
	if (bSimulate) { return quicklookupMenu.call({ selItems: { Count: 1 }, buttonsProperties: this.buttonsProperties, prefix: this.prefix }, { bSimulate: false }); }
	// Safe Check
	if (!this.selItems || !this.selItems.Count) {
		this.selItems = fb.GetSelections(1);
		if (!this.selItems || !this.selItems.Count) { this.selItems = null; console.log('Quicklookup: No selected items.'); }
	}
	const entries = JSON.parse(this.buttonsProperties.entries[1]);
	const sortTF = this.buttonsProperties.sortTF[1];
	// Menu
	const menu = new _menu({ onBtnUp: () => this.selItems = null });
	menu.newEntry({ entryText: 'Specify source (Ctrl):', flags: MF_GRAYED });
	menu.newSeparator();
	{	// Same...
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator();
			} else {
				// Create names for all entries
				entry.name = entry.name.cut(30);
				// Entries
				menu.newEntry({
					entryText: entry.name + (this.selItems ? '' : '\t[no sel]'), func: () => {
						const bCtrl = utils.IsKeyPressed(VK_CONTROL);
						const input = bCtrl
							? Input.json('array strings', ['Library Viewer Selection'], 'Specify the playlists for lookup:\n(JSON strings array)\n\nPressing Shift will select matches at given sources instead of sending them to a new playlist.', 'Quicklookup: sources', ['Top Tracks', 'Playlist B']) || Input.lastInput
							: null;
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						if (input !== null && bShift) {
							let bFocusSet = false;
							input.map((n) => getPlaylistIndexArray(n)).flat(Infinity).forEach((plsIdx) => {
								const source = plman.GetPlaylistItems(plsIdx);
								const idxArr = selectTracksAtPlaylist({
									items: matchTagsProcess({ selTfArr: entry.tfFrom, sourceTfArr: entry.tfTo, source, handleList: this.selItems }).outputHandleList,
									plsIdx
								});
								if (!bFocusSet && idxArr.length) {
									plman.ActivePlaylist = plsIdx;
									plman.EnsurePlaylistItemVisible(plman.ActivePlaylist, idxArr[0]);
									bFocusSet = true;
								}
							});
						} else {
							const source = input === null
								? getSource('library')
								: getSource('playlist', input);
							matchTags({
								selTfArr: entry.tfFrom,
								sourceTfArr: entry.tfTo,
								sort: entry.sort || { tfo: sortTF },
								source,
								handleList: this.selItems,
								playlistNameArgs: { entryName: entry.name, input: this.buttonsProperties.playlistName[1] },
							});
						}
					}, flags: this.selItems ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
				});
			}
		});
	}
	menu.newSeparator();
	{	// Static menu: user configurable
		menu.newEntry({
			entryText: 'By... (custom)' + (this.selItems ? '' : '\t[no sel]'), func: () => {
				const lastEntry = _jsonParse(this.buttonsProperties.lastLookup[1]) || { tfFrom: ['ARTIST', 'ALBUM ARTIST'], tfSource: [] };
				const entry = {};
				entry.tfFrom = Input.json('array strings', lastEntry.tfFrom,
					'Enter tag names:\n(JSON strings array)\n\n' +
					'Ex:\n' + JSON.stringify(['ARTIST', 'ALBUM ARTIST'])
					, 'Quicklookup: Selection tags', JSON.stringify(['ARTIST', 'ALBUM ARTIST']), [(array) => array.length !== 0], true) || (Input.isLastEqual ? Input.lastInput : null);
				if (!entry.tfFrom) { return; }
				entry.tfTo = Input.json('array strings', lastEntry.tfSource || [],
					'Enter tag names:\n(JSON strings array)\n\n' +
					'To use same tags than selection, leave it empty ([]).\n' +
					'Ex:\n' + JSON.stringify(['ARTIST', 'ALBUM ARTIST'])
					, 'Quicklookup: Source tags', JSON.stringify([]), void (0), true) || (Input.isLastEqual ? Input.lastInput : null);
				if (!entry.tfTo) { return; }
				if (!entry.tfTo.length) { delete entry.tfTo; }
				this.buttonsProperties.lastLookup[1] = JSON.stringify(entry);
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				const bCtrl = utils.IsKeyPressed(VK_CONTROL);
				const input = bCtrl
					? Input.json('array strings', ['Library Viewer Selection'], 'Specify the playlists for lookup:\n(JSON strings array)', 'Quicklookup: sources', ['Top Tracks', 'Playlist B']) || Input.lastInput
					: null;
				if (input !== null && bShift) {
					let bFocusSet = false;
					input.map((n) => getPlaylistIndexArray(n)).flat(Infinity).forEach((plsIdx) => {
						const source = plman.GetPlaylistItems(plsIdx);
						const idxArr = selectTracksAtPlaylist({
							items: matchTagsProcess({ selTfArr: entry.tfFrom, sourceTfArr: entry.tfTo, source, handleList: this.selItems }).outputHandleList,
							plsIdx
						});
						if (!bFocusSet && idxArr.length) {
							plman.ActivePlaylist = plsIdx;
							plman.EnsurePlaylistItemVisible(plman.ActivePlaylist, idxArr[0]);
							bFocusSet = true;
						}
					});
				} else {
					const source = input === null
						? getSource('library')
						: getSource('playlist', input);
					matchTags({
						selTfArr: entry.tfFrom,
						sourceTfArr: entry.tfTo,
						sort: entry.sort || { tfo: sortTF },
						source,
						handleList: this.selItems,
						playlistNameArgs: { input: this.buttonsProperties.playlistName[1] },
					});
				}
			}, flags: this.selItems ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
		});
	}
	return menu;
}