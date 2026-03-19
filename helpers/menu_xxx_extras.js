'use strict';
//19/03/26

/* exported _createSubMenuEditEntries */

include('menu_xxx.js');
/* global _menu:readable, MF_GRAYED:readable, MF_STRING:readable */
include('helpers_xxx_basic_js.js');
/* global clone:readable */
// helpers_xxx_prototypes_smp.js
/* window.FullPanelName:readable */

/**
 * Description
 *
 * @function
 * @name _createSubMenuEditEntries
 * @kind function
 * @param {_menu} parent - Menu object
 * @param {string} menuName - Parent menu name
 * @param {object} options - Options object
 * @param {string} options.name - Popup name
 * @param {string} options.subMenuName - Edit entries sub-menu
 * @param {{name: string, any}[]} options.list - Current entries list. Every entry must have at least a 'name' key present.
 * @param {{name: string, any}[]} options.defaults - Default entries used on 'reset'
 * @param {() => Object|null} options.input - Function which returns an entry object. No need to add logic for 'name' key, it's built-in. Only add whatever you need. Make sure it returns null or undefined if user cancels or values are not valid!
 * @param {string} options.bAdd - [=true] Flag to show an 'Add entry' option on submenu
 * @param {string} options.bNumbered - [=true] Flag to enumerate each entry shown
 * @param {string} options.bDuplicate - [=false] Flag to allow entries with duplicated name
 * @param {string} options.bClone - [=true] Flag to show a 'Clone entry' option on submenu. Requires bAdd to also be true.
 * @param {string} options.bCopyCurrent - [=false] Flag to show a 'Copy current settings' option on submenu
 * @param {string} options.bMove - [=true] Flag to show a 'Move entry' option on submenu
 * @param {string} options.bEditAll - [=true] Flag to show an 'Edit all entries' option on submenu
 * @param {(list: {name: string, any}[], modified: {name: string}, event: 'edit'|'move'|'clone'|'update'|'reset'|'delete'|'add'|'defaults') => void} options.onBtnUp - Function to run after any menu entry is clicked (usually to save the modified entries on properties). List is passed as argument.
 * @returns {void}
 */
function _createSubMenuEditEntries(parent, menuName, options) { // NOSONAR
	if (options.onBtnUp && !_menu.isFunction(options.onBtnUp)) {
		throw new Error('_createSubMenuEditEntries: onBtnUp is not a function');
	}
	if (!options.defaults) { options.defaults = []; }
	if (!options.list || !Array.isArray(options.list) || !Array.isArray(options.defaults) || !options.input || !_menu.isFunction(options.input)) {
		throw new Error('_createSubMenuEditEntries: list, defaults or input options are non valid or not provided');
	}
	// options.list always point to the original entry list and original values are edited
	const subMenuSecondName = parent.newMenu(options.subMenuName || 'Edit entries from list', menuName); // It will throw if the menu already exists!
	let i = 0;
	const bAdd = !Object.hasOwn(options, 'bAdd') || options.bAdd;
	const bClone = bAdd && (!Object.hasOwn(options, 'bClone') || options.bClone) && typeof clone !== 'undefined';
	const bMove = !Object.hasOwn(options, 'bMove') || options.bMove;
	const bEditAll = !Object.hasOwn(options, 'bEditAll') || options.bEditAll;
	options.list.forEach((entry, index) => {
		if (parent.isNotSeparator(entry)) { i++; }
		const entryName = parent.isSeparator(entry)
			? '------(separator)------' + parent.getNextId()
			: (options.bNumbered ? i + '. ' : '') + (entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name);
		const subMenuThirdName = parent.newMenu(entryName, subMenuSecondName);
		parent.newEntry({
			menuName: subMenuThirdName, entryText: 'Edit entry...', func: (prevEntry) => {
				const oriEntry = JSON.stringify(prevEntry || entry);
				let newEntry = oriEntry;
				try { newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', options.name, oriEntry, true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (newEntry === oriEntry) { return; }
				if (!newEntry || !newEntry.length) { fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return; }
				try { newEntry = JSON.parse(newEntry); } catch (e) { fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return; }
				if (!newEntry) { return; }
				if (!options.bDuplicate && options.list.filter((otherEntry) => otherEntry !== entry).findIndex((otherEntry) => otherEntry.name === newEntry.name) !== -1) {
					fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', window.FullPanelName || (window.Name + ' (' + window.ScriptInfo.Name + ')'));
					return parent.retry({ args: newEntry });
				}
				options.list[index] = newEntry;
				if (options.onBtnUp) { options.onBtnUp(options.list, newEntry, 'edit'); }
				return options.list;
			}, flags: parent.isSeparator(entry) ? MF_GRAYED : MF_STRING
		});
		if (bMove) {
			parent.newEntry({
				menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
					let pos = 1;
					try { pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', options.name, pos, true)); }
					catch (e) { return; } // eslint-disable-line no-unused-vars
					if (pos === 0 || !Number.isSafeInteger(pos)) { return; }
					if (index - pos < 0) { pos = 0; }
					else if (index - pos >= options.list.length) { pos = options.list.length; }
					else { pos = index - pos; }
					options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
					if (options.onBtnUp) { options.onBtnUp(options.list, options.list[pos], 'move'); }
					return options.list;
				}
			});
		}
		if (bClone) {
			parent.newSeparator(subMenuThirdName);
			parent.newEntry({
				menuName: subMenuThirdName, entryText: 'Clone entry...', func: (prevName) => {
					// Input all variables
					let input;
					let entryName = '';
					if (parent.isNotSeparator(entry)) {
						try { entryName = utils.InputBox(window.ID, 'Enter new name for cloned menu entry:', prevName || options.name, '', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!entryName.length) { return; }
						if (parent.isSeparator({ name: entryName })) { return; }
						else { // or new entry
							if (!options.bDuplicate && options.list.findIndex((entry) => entry.name === entryName) !== -1) {
								fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', window.Name + ' (' + window.ScriptInfo.Name + ')');
								return parent.retry({ args: entryName });
							}
							input = { ...entry };
							input.name = entryName;
						}
					} else {
						input = { ...entry };
					}
					// Add entry
					options.list.push(input);
					if (options.onBtnUp) { options.onBtnUp(options.list, input, 'clone'); }
					return options.list;
				}
			});
		}
		if (bAdd && options.bCopyCurrent && parent.isNotSeparator(entry)) {
			parent.newSeparator(subMenuThirdName);
			parent.newEntry({
				menuName: subMenuThirdName, entryText: 'Update with current settings', func: () => {
					const current = options.input(true);
					if (!current) { return; }
					for (let key in current) { entry[key] = current[key]; }
					if (options.onBtnUp) { options.onBtnUp(options.list, entry, 'update'); }
					return options.list;
				}
			});
		}
		const defTag = options.defaults.find((defTag) => entry.name === defTag.name);
		if (defTag) {
			parent.newSeparator(subMenuThirdName);
			parent.newEntry({
				menuName: subMenuThirdName, entryText: 'Reset default entry', func: () => {
					options.list[index] = defTag;
					if (options.onBtnUp) { options.onBtnUp(options.list, defTag, 'reset'); }
					return options.list;
				}
			});
		}
		parent.newSeparator(subMenuThirdName);
		parent.newEntry({
			menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
				const deleted = options.list.splice(index, 1)[0];
				if (options.onBtnUp) { options.onBtnUp(options.list, deleted, 'delete'); }
				return options.list;
			}
		});
	});
	if (!options.list.length) { parent.newEntry({ menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
	parent.newSeparator(subMenuSecondName);
	if (bAdd) {
		parent.newEntry({
			menuName: subMenuSecondName, entryText: 'Add new entry to list...', func: (prevEntryName) => {
				// Input all variables
				let input;
				let entryName = '';
				try { entryName = utils.InputBox(window.ID, 'Enter name for menu entry:\nWrite \'sep\' to add a line.', prevEntryName || options.name, '', true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (!entryName.length) { return; }
				if (parent.isSeparator({ name: entryName })) { input = { name: entryName }; } // Add separator
				else { // or new entry
					if (!options.bDuplicate && options.list.findIndex((entry) => entry.name === entryName) !== -1) {
						fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', window.Name + ' (' + window.ScriptInfo.Name + ')');
						return parent.retry({ args: entryName });
					}
					const entry = options.input(entryName);
					if (!entry) { return; }
					input = { name: entryName, ...entry };
				}
				// Add entry
				options.list.push(input);
				if (options.onBtnUp) { options.onBtnUp(options.list, input, 'add'); }
				return options.list;
			}
		});
	}
	if (bEditAll) {
		parent.newSeparator(subMenuSecondName);
		parent.newEntry({
			menuName: subMenuSecondName, entryText: 'Edit all entries...', func: (prevEntries) => {
				const oriEntries = JSON.stringify(prevEntries || options.list);
				let newEntries = oriEntries;
				try { newEntries = utils.InputBox(window.ID, 'Edit entries as JSON:', options.name, oriEntries, true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (newEntries === oriEntries) { return; }
				if (!newEntries || !newEntries.length) { fb.ShowPopupMessage('Input: ' + newEntries + '\n\nNon valid entries.', 'JSON error'); return; }
				try { newEntries = JSON.parse(newEntries); } catch (e) { fb.ShowPopupMessage('Input: ' + newEntries.toString() + '\n\n' + e, 'JSON error'); return; }
				if (!newEntries) { return; }
				if (!options.bDuplicate) {
					const names = newEntries.filter(parent.isNotSeparator).map((entry) => entry.name);
					if (new Set(names).size !== names.length) {
						fb.ShowPopupMessage('List contains entries with duplicated names.\nRetry with other names.\n\n' + names.joinEvery(', ', 3), window.FullPanelName || (window.Name + ' (' + window.ScriptInfo.Name + ')'));
						return parent.retry({ args: newEntries });
					}
				}
				options.list.length = 0;
				newEntries.forEach((entry) => options.list.push(entry));
				if (options.onBtnUp) { options.onBtnUp(options.list, options.list, 'editall'); }
				return options.list;
			}
		});
	}
	if (options.defaults.length) {
		parent.newSeparator(subMenuSecondName);
		parent.newEntry({
			menuName: subMenuSecondName, entryText: 'Restore defaults...', func: () => {
				options.list.length = 0;
				clone(options.defaults).forEach(e => options.list.push(e));
				if (options.onBtnUp) { options.onBtnUp(options.list, options.list, 'defaults'); }
				return options.list;
			}
		});
	}
}