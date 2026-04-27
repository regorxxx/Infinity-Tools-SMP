'use strict';
//27/04/26

/* exported overwritePanelProperties, loadProperties, createSubMenuEditEntries, lastActionEntry, focusFlags, playlistCountFlags, playlistCountFlagsRem, playlistCountFlagsAddRem, multipleSelectedFlags, multipleSelectedFlagsReorder, selectedFlags, selectedFlagsReorder, selectedFlagsRem, selectedFlagsAddRem, closeLock, createTagMenu, createSmartShuffleMenu */

/* global configMenu:readable, readmes:readable, menu:readable, menu_properties:readable, scriptName:readable, defaultArgs:readable, menu_panelProperties:readable,  shortcutsPath:readable, presets:writable, menu_prefix_panel:readable, shortcuts:writable, menu_propertiesBack:writable, menu_panelPropertiesBack:writable, menu_prefix:readable, deferFunc:readable, isPlayCount:readable, sbd:readable, entryMaxLength:readable */ // eslint-disable-line no-unused-vars

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, utf8:readable, _save:readable, _explorer:readable, _jsonParseFileCheck:readable, WshShell:readable, popup:readable, MF_STRING:readable, _recycleFile:readable, _open:readable, setProperties:readable, doOnce:readable, getPropertiesPairs:readable, overwriteProperties:readable, isFunction:readable, clone:readable, _q:readable, compareObjects:readable , debounce:readable, _b:readable, tagsCache:readable, Input:readable */

/*
	Helpers
*/
function overwriteMenuProperties() { overwriteProp(menu_properties, menu_prefix); overwriteDefaultArgs(); }
function overwritePanelProperties() { overwriteProp(menu_panelProperties, menu_prefix_panel); overwriteDefaultArgs(); }
function overwriteProp(properties, prefix) { setProperties(properties, prefix, 0, false, true); }
function overwriteDefaultArgs() {
	for (let key in defaultArgs) {
		if (Object.hasOwn(menu_properties, key)) { // Also check updateMenuProperties()
			if (key === 'styleGenreTag' || key === 'checkDuplicatesBy') { defaultArgs[key] = JSON.parse(menu_properties[key][1]); }
			else if (key === 'keyTag') { defaultArgs[key] = JSON.parse(menu_properties[key][1])[0]; }
			else if (key === 'ratingLimits') { defaultArgs[key] = menu_properties[key][1].split(','); }
			else { defaultArgs[key] = menu_properties[key][1]; }
		} else if (Object.hasOwn(menu_panelProperties, key)) {
			defaultArgs[key] = menu_panelProperties[key][1];
		}
	}
}

function loadProperties() {
	if (typeof buttonsBar === 'undefined' && Object.keys(menu_properties).length) { // Merge all properties when not loaded along buttons
		// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
		if (Object.keys(menu_panelProperties).length) {
			Object.entries(menu_panelProperties).forEach(([key, value]) => { menu_properties[key] = value; });
		}
		setProperties(menu_properties, menu_prefix, 0);
		updateMenuProperties(getPropertiesPairs(menu_properties, menu_prefix, 0));
	} else if (Object.keys(menu_panelProperties).length) { // With buttons, set these properties only once per panel
		setProperties(menu_panelProperties, menu_prefix_panel, 0);
	}
}

function updateMenuProperties(propObject, menuFunc = deferFunc) {
	// Sanity checks
	propObject['playlistLength'][1] = Number(propObject['playlistLength'][1]);
	if (!Number.isSafeInteger(propObject['playlistLength'][1]) || propObject['playlistLength'][1] <= 0) { fb.ShowPopupMessage('Playlist length must be a positive integer.\n' + propObject['playlistLength'].slice(0, 2), scriptName); }
	try { fb.GetQueryItems(new FbMetadbHandleList(), propObject['forcedQuery'][1]); }
	catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + propObject['forcedQuery'], scriptName); } // eslint-disable-line no-unused-vars
	// Info Popup
	let panelPropObject = (typeof buttonsBar === 'undefined') ? propObject : getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0);
	if (!panelPropObject['firstPopup'][1]) {
		panelPropObject['firstPopup'][1] = true;
		overwriteProperties(panelPropObject); // Updates panel
		const readmeKeys = ['Tagging requisites']; // Must read files on first execution
		readmeKeys.forEach((key) => {
			const readmePath = readmes[key];
			const readme = _open(readmePath, utf8);
			if (readme.length) { fb.ShowPopupMessage(readme, key); }
		});
	}
	// Default values
	['async', 'dynQueryEvalSel'].forEach((prop) => {
		const curr = JSON.parse(propObject[prop][1]);
		const def = JSON.parse(propObject[prop][3]);
		const currKeys = new Set(Object.keys(curr));
		const defKeys = new Set(Object.keys(def));
		if (!currKeys.isEqual(defKeys)) {
			defKeys.forEach((key) => {
				if (Object.hasOwn(curr, key)) { currKeys.delete(key); }
				else { curr[key] = def[key]; }
			});
			currKeys.forEach((key) => delete curr[key]);
			propObject[prop][1] = JSON.stringify(curr);
			overwriteProperties(propObject);
		}
	});
	// And update
	Object.entries(panelPropObject).forEach(([key, value]) => {
		if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = value[1]; }
	});
	Object.entries(propObject).forEach(([key, value]) => {
		if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = value[1]; }
		// Specific
		if (key === 'ratingLimits') { defaultArgs[key] = defaultArgs[key].split(','); }
		if (key === 'styleGenreTag' || key === 'checkDuplicatesBy') { defaultArgs[key] = JSON.parse(defaultArgs[key]); }
		if (key === 'keyTag') { defaultArgs[key] = JSON.parse(defaultArgs[key])[0]; }
	});
	if (Object.hasOwn(propObject, 'sortInputDuplic') && Object.hasOwn(propObject, 'sortInputFilter') && Object.hasOwn(propObject, 'nAllowed')) {
		updateShortcutsNames({ sortInputDuplic: propObject.sortInputDuplic[1], sortInputFilter: propObject.sortInputFilter[1], nAllowed: propObject.nAllowed[1] });
	}
	// Presets
	presets = JSON.parse(propObject['presets'][1]); // NOSONAR
	// Backup defaults
	doOnce('Backup', () => {
		menu_propertiesBack = clone(menu_properties); // NOSONAR
		menu_panelPropertiesBack = clone(menu_panelProperties); // NOSONAR
		if (menu_panelProperties.bDebug[1]) { console.log('Playlist Tools: creating default settings...'); }
	})();
	doOnce('Load tags cache', debounce(() => {
		if (menu_properties.bTagsCache && menu_properties.bTagsCache[1]) {
			if (typeof tagsCache !== 'undefined') { tagsCache.load(); }
		}
	}, 5000))();
	// Store for internal use
	if (menu_panelProperties.bDebug[1]) { console.log('Playlist Tools: updating settings...'); }
	for (let key in propObject) {
		if (Object.hasOwn(menu_properties, key)) {
			menu_properties[key][1] = propObject[key][1];
		}
	}
	for (let key in panelPropObject) {
		menu_panelProperties[key][1] = panelPropObject[key][1];
	}
	// Other funcs by menus
	menuFunc.forEach((obj) => {
		if (Object.hasOwn(obj, 'func') && isFunction(obj.func)) {
			obj.func(propObject);
		}
	});
}

function updateShortcutsNames(keys = {}) {
	if (_isFile(shortcutsPath)) {
		const data = _jsonParseFileCheck(shortcutsPath, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (Object.keys(keys).length) {
				const sortInputDuplic = Object.hasOwn(keys, 'sortInputDuplic') ? keys.sortInputDuplic.replace(/,/g, ', ') : null;
				const sortInputFilter = Object.hasOwn(keys, 'sortInputFilter') ? keys.sortInputFilter.replace(/,/g, ', ') : null;
				const nAllowed = Object.hasOwn(keys, 'nAllowed') ? '(' + keys.nAllowed + ')' : null;
				for (const key in data) {
					if (data[key].menu === 'Duplicates and tag filtering\\Remove duplicates by ' && sortInputDuplic) { data[key].menu += sortInputDuplic; }
					if (data[key].menu === 'Duplicates and tag filtering\\Filter playlist by ' && sortInputFilter && nAllowed) { data[key].menu += sortInputFilter + ' ' + nAllowed; }
				}
			}
			shortcuts = data; // NOSONAR
		}
	} else {
		_save(shortcutsPath, JSON.stringify(shortcuts, null, '\t').replace(/\n/g, '\r\n'));
	}
}

function createDefaultPreset(options /* name, propName, defaultPreset, defaults*/) {
	let bSave = false;
	const defaults = {
		readme: 'Default entries for ' + _q(options.name) + '.',
		[options.propName]: options.defaults
	};
	if (_isFile(options.defaultPreset)) {
		const data = _jsonParseFileCheck(options.defaultPreset, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (!compareObjects(data, defaults)) { bSave = true; }
		} else { bSave = true; }
	} else { bSave = true; }
	if (bSave) { _save(options.defaultPreset, JSON.stringify(defaults, null, '\t').replace(/\n/g, '\r\n')); }
}

function createSubMenuEditEntries(menuName, options /*{name, list, propName, defaults, defaultPreset, input, bAdd, bClone, bCopyCurrent, bImport, bDefaultFile, bUseFolders }*/) { // NOSONAR
	const subMenuSecondName = menu.newMenu('Edit entries from list', menuName);
	const optionsNames = new Set();
	const entryFolders = {};
	const bAdd = !Object.hasOwn(options, 'bAdd') || options.bAdd;
	const bClone = bAdd && !Object.hasOwn(options, 'bClone') || options.bClone;
	const bImport = !Object.hasOwn(options, 'bImport') || options.bImport;
	const findPresetIdx = (preset, name = preset.name) => {
		const presetIdxJSON = presets[options.propName].findIndex((obj) => JSON.stringify(obj) === preset);
		const presetIdxName = presetIdxJSON === -1
			? presets[options.propName].findIndex((obj) => obj.name === name)
			: -1;
		return presetIdxJSON === -1 // Harden against manual changes since name is unique
			? presetIdxName
			: presetIdxJSON;
	};
	options.list.forEach((entry, index) => {
		let parentMenu = subMenuSecondName;
		if (options.bUseFolders && Object.hasOwn(entry, 'folder') && entry.folder.length) {
			if (!Object.hasOwn(entryFolders, entry.folder)) { entryFolders[entry.folder] = menu.findOrNewMenu(entry.folder, parentMenu); }
			parentMenu = entryFolders[entry.folder];
		}
		const id = menu.isNotSeparator(entry) && optionsNames.has(entry.name)
			? '\t' + _b('duplicated: ' + index)
			: optionsNames.add(entry.name) && ''; // Allow duplicates and mark them
		const entryName = (menu.isSeparator(entry)
			? '------(separator)------'
			: entry.name.cut(entryMaxLength)) + id;
		const subMenuThirdName = menu.newMenu(entryName, parentMenu);
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Edit entry...', func: () => {
				const oriEntry = JSON.stringify(entry);
				let newEntry = oriEntry;
				try { newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', scriptName + ': ' + options.name, oriEntry, true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (newEntry === oriEntry) { return; }
				if (!newEntry || !newEntry.length) { fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return; }
				try { newEntry = JSON.parse(newEntry); } catch (e) { fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return; }
				if (!newEntry) { return; }
				if (options.list.filter((otherEntry) => otherEntry !== entry).some((otherEntry) => otherEntry.name === newEntry.name) ) {
					fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
					return;
				}
				options.list[index] = newEntry;
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				// Presets
				if (Object.hasOwn(presets, options.propName)) {
					const presetIdx = findPresetIdx(oriEntry, entry.name);
					if (presetIdx !== -1) {
						presets[options.propName][presetIdx] = newEntry;
						menu_properties.presets[1] = JSON.stringify(presets);
					}
				}
				overwriteMenuProperties(); // Updates panel
			}, flags: menu.isSeparator(entry) ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
				let pos = 1;
				try { pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', scriptName + ': ' + options.name, pos, true)); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (pos === 0 || !Number.isSafeInteger(pos)) { return; }
				if (index - pos < 0) { pos = 0; }
				else if (index - pos >= options.list.length) { pos = options.list.length; }
				else { pos = index - pos; }
				options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				overwriteMenuProperties(); // Updates panel
			}
		});
		if (bClone) {
			menu.newSeparator(subMenuThirdName);
			menu.newEntry({
				menuName: subMenuThirdName, entryText: 'Clone entry...', func: () => {
					// Input all variables
					let input;
					let entryName = '';
					if (menu.isNotSeparator(entry)) {
						try { entryName = utils.InputBox(window.ID, 'Enter new name for cloned menu entry:', scriptName + ': ' + options.name, '', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!entryName.length) { return; }
						if (menu.isSeparator({ name: entryName })) { return; } // Add separator
						else { // or new entry
							if (options.list.some((entry) => entry.name === entryName) ) {
								fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
								return;
							}
							input = { ...entry };
							input.name = entryName;
						}
					} else {
						input = { ...entry };
					}
					// Add entry
					options.list.push(input);
					// Save as property
					menu_properties[options.propName][1] = JSON.stringify(options.list); // And update property with new value
					// Presets
					if (!Object.hasOwn(presets, options.propName)) { presets[options.propName] = []; }
					presets[options.propName].push(input);
					menu_properties.presets[1] = JSON.stringify(presets);
					overwriteMenuProperties(); // Updates panel
				}
			});
		}
		if (bAdd && options.bCopyCurrent && menu.isNotSeparator(entry)) {
			menu.newSeparator(subMenuThirdName);
			menu.newEntry({
				menuName: subMenuThirdName, entryText: 'Update with current settings', func: () => {
					const oriEntry = JSON.stringify(entry);
					const current = options.input(true);
					if (!current) { return; }
					for (let key in current) { options.list[index][key] = current[key]; }
					menu_properties[options.propName][1] = JSON.stringify(options.list);
					// Presets
					if (Object.hasOwn(presets, options.propName)) {
						const presetIdx = findPresetIdx(oriEntry, entry.name);
						if (presetIdx !== -1) {
							presets[options.propName][presetIdx] = options.list[index];
							menu_properties.presets[1] = JSON.stringify(presets);
						}
					}
					menu_properties.presets[1] = JSON.stringify(presets);
					overwriteMenuProperties(); // Updates panel
				}
			});
		}
		menu.newSeparator(subMenuThirdName);
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
				options.list.splice(index, 1);
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				// Presets
				if (Object.hasOwn(presets, options.propName)) {
					const presetIdx = findPresetIdx(entry);
					if (presetIdx !== -1) {
						presets[options.propName].splice(presetIdx, 1);
						if (!presets[options.propName].length) { delete presets[options.propName]; }
						menu_properties['presets'][1] = JSON.stringify(presets);
					}
				}
				overwriteMenuProperties(); // Updates panel
			}
		});
		if (bImport) {
			menu.newSeparator(subMenuThirdName);
			const presetIdx = Object.hasOwn(presets, options.propName) && presets[options.propName].length > 0
				? findPresetIdx(entry)
				: - 1;
			menu.newEntry({
				menuName: subMenuThirdName, entryText: 'Export preset...', func: () => {
					const path = folders.export + options.propName + '_' + entry.name.replaceAll(' ', '_') + '.json';
					_recycleFile(path, true);
					const readme = 'Backup ' + new Date().toString();
					if (_save(path, JSON.stringify({ readme, [options.propName]: presets[options.propName][presetIdx] }, null, '\t').replace(/\n/g, '\r\n'))) {
						_explorer(path);
						console.log('Playlist tools: presets backup saved at ' + path);
					}
				}, flags: presetIdx === -1 ? MF_GRAYED : MF_STRING
			});
		}
	});
	if (!options.list.length) { menu.newEntry({ menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
	if (bImport || bAdd) { menu.newSeparator(subMenuSecondName); }
	if (bAdd) {
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Add new entry to list...', func: () => {
				// Input all variables
				let input;
				let entryName = '';
				try { entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + options.name, '', true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (!entryName.length) { return; }
				if (menu.isSeparator({ name: entryName })) { input = { name: entryName }; } // Add separator
				else { // or new entry
					if (options.list.some((entry) => entry.name === entryName) ) {
						fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
						return;
					}
					const entry = options.input();
					if (!entry) { return; }
					input = { name: entryName, ...entry };
				}
				// Add entry
				options.list.push(input);
				// Save as property
				menu_properties[options.propName][1] = JSON.stringify(options.list); // And update property with new value
				// Presets
				if (!Object.hasOwn(presets, options.propName)) { presets[options.propName] = []; }
				presets[options.propName].push(input);
				menu_properties.presets[1] = JSON.stringify(presets);
				overwriteMenuProperties(); // Updates panel
			}
		});
	}
	if (bImport) {
		menu.newSeparator(subMenuSecondName);
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Import presets...', func: () => {
				importPreset(options.defaultPreset);
			}
		});
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Export presets...', func: () => {
				const answer = WshShell.Popup('This will export all user presets (but not the default ones) as a json file, which can be imported later in any Playlist Tools panel.\nThat file can be easily edited with a text editor to add, tune or remove entries.', 0, scriptName + ': ' + options.name, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const path = folders.export + options.propName + '_presets.json';
					_recycleFile(path, true);
					const readme = 'Backup ' + new Date().toString();
					if (_save(path, JSON.stringify({ readme, [options.propName]: presets[options.propName] }, null, '\t').replace(/\n/g, '\r\n'))) {
						_explorer(path);
						console.log('Playlist tools: presets backup saved at ' + path);
					}
				}
			}, flags: Object.hasOwn(presets, options.propName) && presets[options.propName].length > 0 ? MF_STRING : MF_GRAYED
		});
	}
	menu.newSeparator(subMenuSecondName);
	menu.newEntry({
		menuName: subMenuSecondName, entryText: 'Restore defaults...', func: () => {
			options.list = [...options.defaults];
			menu_properties[options.propName][1] = JSON.stringify(options.list);
			// Presets
			if (Object.hasOwn(presets, options.propName)) {
				delete presets[options.propName];
				menu_properties.presets[1] = JSON.stringify(presets);
			}
			overwriteMenuProperties(); // Updates panel
		}
	});
	if (options.bDefaultFile) { createDefaultPreset(options); } // Write default file
}

function importPreset(path = folders.data + 'playlistTools_presets.json') {
	let file;
	try { file = utils.InputBox(window.ID, 'Do you want to import a presets file?\nWill not overwrite current ones.\n(input path to file)', scriptName + ': ' + configMenu, path, true); }
	catch (e) { return false; } // eslint-disable-line no-unused-vars
	if (!file.length) { return false; }
	const newPresets = _jsonParseFileCheck(file, 'Presets', scriptName, utf8);
	if (!newPresets) { return false; }
	// Load description
	let readme = '';
	if (Object.hasOwn(newPresets, 'readme')) {
		readme = newPresets.readme;
		delete newPresets.readme;
	}
	// Check
	const keys = Object.keys(newPresets);
	if (keys.some((key) => !Object.hasOwn(menu_properties, key))) {
		readme += (readme.length ? '\n\n' : '');
		fb.ShowPopupMessage(
			readme +
			'Some keys are not recognized:\n\n' +
			keys.map((key) => Object.hasOwn(menu_properties, key) ? null : key).filter(Boolean).join('\n'),
			scriptName + ': Presets (' + file.split('\\').pop() + ')'
		);
		return false;
	}
	// List entries
	const presetList = keys.map((key) =>
		'+ ' + key + ' -> ' + menu_properties[key][0] + '\n\t- ' + newPresets[key].map((preset) =>
			preset.name + (Object.hasOwn(preset, 'method') ? ' (' + preset.method + ')' : '')
		).join('\n\t- ')
	);
	readme += (readme.length ? '\n\n' : '') + 'List of presets:\n' + presetList;
	fb.ShowPopupMessage(readme, scriptName + ': Presets (' + file.split('\\').pop() + ')');
	// Accept?
	const answer = WshShell.Popup('Check the popup for description. Do you want to import it?', 0, scriptName + ': Presets (' + file.split('\\').pop() + ')', popup.question + popup.yes_no);
	if (answer === popup.no) { return false; }
	// Import
	keys.forEach((key) => {
		// Merge with current presets
		let currentMenu = JSON.parse(menu_properties[key][1]);
		if (Object.hasOwn(presets, key)) { presets[key] = [...presets[key], ...newPresets[key]]; }
		else { presets[key] = newPresets[key]; }
		currentMenu = currentMenu.concat(newPresets[key]);
		menu_properties[key][1] = JSON.stringify(currentMenu);
	});
	// Save all
	menu_properties.presets[1] = JSON.stringify(presets);
	overwriteMenuProperties(); // Updates panel
	return true;
}

function lastActionEntry() {
	const fullName = menu.lastCall.length ? menu.lastCall : null;
	let entryText = fullName ? fullName.replace(/.*\\/, '') : null;
	let flags = MF_STRING;
	if (entryText === null) {
		entryText = '- No last action -';
		flags = MF_GRAYED;
	} else {
		// Reuse original flags
		const entry = menu.getEntries().find((entry) => entry.entryText === entryText.replace(/.*\\/, ''));
		if (entry) { flags = entry.flags; }
		// Prefer the full name if entry name is not clear enough
		if (/^by/i.test(entryText)) { entryText = fullName; }
		entryText = 'Last: ' + entryText;
	}
	return { entryText, fullName, flags };
}

/*
	Flags
*/
const flagsCache = {};
flagsCache.focus = null;
flagsCache.plsItemCount = {};
flagsCache.selItems = {};
flagsCache.getFocus = () => {
	return flagsCache.focus || (flagsCache.focus = fb.GetFocusItem(true));
}; flagsCache.getPlsItemCount = (idx) => {
	return flagsCache.plsItemCount[idx] || (flagsCache.plsItemCount[idx] = plman.PlaylistItemCount(idx));
};
flagsCache.getSelItemsCount = (idx) => {
	return flagsCache.selItems[idx] || (flagsCache.selItems[idx] = plman.GetPlaylistSelectedItems(idx).Count);
};
function focusFlags() { return (flagsCache.getFocus() ? MF_STRING : MF_GRAYED); }

function playlistCountFlags(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) ? MF_STRING : MF_GRAYED); }
function playlistCountFlagsRem(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }
function playlistCountFlagsAddRem(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }

function multipleSelectedFlags(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) >= 3 ? MF_STRING : MF_GRAYED); }
function multipleSelectedFlagsReorder(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) >= 3 && !reorderLock(idx) ? MF_STRING : MF_GRAYED); }

function selectedFlags(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsReorder(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !reorderLock(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsRem(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsAddRem(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }

// plman.ActivePlaylist must be !== -1 to avoid crashes!
flagsCache.lock = {};
flagsCache.getLock = (idx) => {
	return flagsCache.lock[idx] || (flagsCache.lock[idx] = new Set(plman.GetPlaylistLockedActions(idx) || []));
};
function reorderLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('ReorderItems');
}
function addLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('AddItems');
}
function removeLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('RemoveItems');
}
function closeLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('RemovePlaylist');
}

const createTagMenu = (menuName, options, flag = [], hook = null, entryNames = [], info = []) => {
	options.forEach((key, i) => {
		if (menu.isSeparator(key)) { menu.newSeparator(menuName); return; }
		const idxEnd = menu_properties[key][0].indexOf('(');
		const value = JSON.parse(menu_properties[key][1]).join(',');
		const entryText = (
			entryNames[i] ||
			menu_properties[key][0].substring(menu_properties[key][0].indexOf('.') + 1, idxEnd === -1
				? Infinity
				: idxEnd - 1
			)
		).replace('\'' + (typeof sbd === 'undefined' ? 'Music Map' : sbd.name) + '\' ', '') + '...' + '\t[' +
			(
				typeof value === 'string'
					? value.length ? value.cut(10) : '-disabled-'
					: value
			) + ']';
		menu.newEntry({
			menuName, entryText, func: () => {
				const example = '["GENRE","GENRE2"]';
				const input = Input.json('array strings', JSON.parse(menu_properties[key][1]), 'Enter tag(s) or TF expression(s): (JSON)\nSetting it to [] disables it, ["DEFAULT"] restores default settings.\n\nFor example:\n' + example + (info[i] ? info[i] : ''), scriptName + ': ' + entryText.replace(/\t.*/, ''), example, void (0), true);
				if (input === null) { return; }
				menu_properties[key][1] = input.length === 1 && input[0].toUpperCase() === 'DEFAULT'
					? menu_properties[key][3]
					: JSON.stringify(input);
				if (hook) { hook(key, i, menu_properties); }
				overwriteMenuProperties(); // Updates panel
			}, flags: (flag[i] === void (0) ? false : flag[i]) ? MF_GRAYED : MF_STRING
		});
	});
};

function createSmartShuffleMenu(menu) {
	const subMenuName = 'Smart shuffle';
	if (!menu.hasMenu(subMenuName, configMenu)) {
		menu.newMenu(subMenuName, configMenu);
		{	// bSmartShuffleAdvc
			menu.newEntry({ menuName: subMenuName, entryText: 'For any tool which uses Smart Shuffle:', func: null, flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			menu.newEntry({
				menuName: subMenuName, entryText: 'Enable extra conditions', func: () => {
					menu_properties.bSmartShuffleAdvc[1] = !menu_properties.bSmartShuffleAdvc[1];
					if (menu_properties.bSmartShuffleAdvc[1]) {
						fb.ShowPopupMessage(
							'Smart shuffle will also try to avoid consecutive tracks with these conditions:' +
							'\n\t-Instrumental tracks.' +
							'\n\t-Live tracks.' +
							'\n\t-Female/male vocals tracks.' +
							'\n\nThese rules apply in addition to the main smart shuffle, swapping tracks' +
							'\nposition whenever possible without altering the main logic.'
							, scriptName + ': ' + configMenu
						);
					}
					overwriteMenuProperties(); // Updates panel
				}
			});
			menu.newCheckMenu(subMenuName, 'Enable extra conditions', void (0), () => { return menu_properties.bSmartShuffleAdvc[1]; });
			{
				const subMenuNameSecond = menu.newMenu('Sorting bias', subMenuName);
				const options = [
					{ key: 'Random', flags: MF_STRING },
					{ key: 'Play count', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
					{ key: 'Rating', flags: MF_STRING },
					{ key: 'Popularity', flags: utils.GetPackageInfo('{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}') ? MF_STRING : MF_GRAYED, req: 'Find & Play' },
					{ key: 'Last played', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
					{ key: 'Key', flags: MF_STRING },
					{ key: 'Key 6A centered', flags: MF_STRING },
				];
				menu.newEntry({ menuName: subMenuNameSecond, entryText: 'Prioritize tracks by:', flags: MF_GRAYED });
				menu.newSeparator(subMenuNameSecond);
				options.forEach((opt) => {
					const tf = opt.key.replace(/ /g, '').toLowerCase();
					menu.newEntry({
						menuName: subMenuNameSecond, entryText: opt.key + (opt.flags ? '\t' + opt.req : ''), func: () => {
							menu_properties.smartShuffleSortBias[1] = tf;
							overwriteMenuProperties(); // Updates panel
						}, flags: opt.flags
					});
				});
				menu.newSeparator(subMenuNameSecond);
				menu.newEntry({
					menuName: subMenuNameSecond, entryText: 'Custom TF...', func: () => {
						const input = Input.string('string', menu_properties.smartShuffleSortBias[1], 'Enter TF expression:', scriptName, menu_properties.smartShuffleSortBias[3]);
						if (input === null) { return; }
						menu_properties.smartShuffleSortBias[1] = input;
						overwriteMenuProperties(); // Updates panel
					}
				});
				menu.newCheckMenu(subMenuNameSecond, options[0].key, 'Custom TF...', () => {
					const idx = options.findIndex((opt) => opt.key.replace(/ /g, '').toLowerCase() === menu_properties.smartShuffleSortBias[1]);
					return idx === -1 ? options.length : idx;
				});
			}
			createTagMenu(subMenuName, ['smartShuffleTag'],
				void (0), void (0), ['Shuffle by tag'],
				[
					'\n\nTag(s) used for smart shuffle sorting. To enable/disable it, directly use the related sorting setting.',
					null,
					'\n\nThese genre/style values will be filtered globally and not considered neither for tag similarity scoring nor for genre/style variation analysis.'
				]
			);
		}
		menu.newSeparator(configMenu);
	}
}