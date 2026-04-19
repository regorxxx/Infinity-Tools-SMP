'use strict';
//19/04/26

/* exported settingsMenu */

/* global buttonsBar:readable, showButtonReadme:readable */

include('helpers_xxx.js');
/* global MF_GRAYED:readable */
include('helpers_xxx_prototypes.js');
/* global isFunction:readable, isJSON:readable, isBoolean:readable, isInt:readable, isReal:readable, isString:readable, isStringWeak:readable */
include('helpers_xxx_properties.js');
/* global overwriteProperties:readable, checkProperty:readable, */
include('menu_xxx.js');
/* global _menu:readable */

/**
 * Returns a settings menu object for a parent button object which allows to set any properties associated.
 *
 * @function
 * @name settingsMenu
 * @kind function
 * @param {object} parent - button context
 * @param {boolean} bShowValues? - show value along the menu entry
 * @param {any[]} readmeFiles? - list of files to show on readme submenu
 * @param {{[key:string]:{name:string, input:string, popup:string, bHide:boolean, bSep:boolean}}} entrySettings? - Where key matches the ones at parent.buttonsProperties. Every time such setting is changed, popup will appear.
 * @param {{[key:string]:(value, key:string) => void}} callbacks? - Where key matches the ones at parent.buttonsProperties. Every time such setting is changed, callback will fire (after changing the setting).
 * @param {(menu:_menu, parent:parent) => void} extraEntries? - Function which could append additional menu entries between the list of properties and the 'Restore defaults...' entry.
 * @param {{parentName:string}} options? - Additional settings.
 * @returns {_menu}
 */
function settingsMenu(parent, bShowValues = false, readmeFiles = [], entrySettings = {}, callbacks = {}, extraEntries = null, options = { parentName: '' }) {
	if (extraEntries && !isFunction(extraEntries)) { throw new Error('settingsMenu: extraEntries is not a function'); }
	const menu = new _menu();
	const properties = parent.buttonsProperties;
	const parentName = options.parentName || (isFunction(parent.text) ? parent.text(parent) : parent.text) || '';
	// Menu
	menu.newEntry({ entryText: 'Configure button:', func: null, flags: MF_GRAYED });
	menu.newSeparator();
	{
		const options = Object.keys(properties);
		options.forEach((key) => {
			const keySettings = entrySettings && Object.hasOwn(entrySettings, key) ? entrySettings[key] : {};
			if (keySettings.bHide) { return; }
			if (keySettings.bSep) { menu.newSeparator(); }
			const value = properties[key][1];
			const check = properties[key][2];
			const type = check
				? check.func === isJSON
					? 'object'
					: check.func === isBoolean
						? 'boolean'
						: [Number.isFinite, isInt, isReal].includes(check.func)
							? 'number'
							: [isString, isStringWeak].includes(check.func)
								? 'string'
								: typeof value
				: typeof value;
			const entryName = Object.hasOwn(keySettings, 'name') ? keySettings.name : properties[key][0].replace(/[A-z]*\d*_*\d*\./, '');
			const entryText = entryName + (bShowValues && type !== 'boolean' ? '\t[' + (type === 'string' || type === 'object' ? value.cut(10) : value) + ']' : '');
			const desc = keySettings.input || '';
			const popupName = parentName + entryName;
			menu.newEntry({
				entryText, func: () => {
					let input;
					switch (type) {
						case 'object': {
							try { input = utils.InputBox(window.ID, desc || 'Enter JSON value:', popupName, value, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							try { JSON.parse(input); } catch (e) { input = null; } // eslint-disable-line no-unused-vars
							if (!input) { fb.ShowPopupMessage('Value must be a JSON object. Check basic rules below:\n\n- Input allows arrays ([]) or objects ({}), the one to use must match the default input value.\n\n- Strings must always be quoted:\n	["value1", "value2"]\n	{ "key": "value" }\n\n- Empty arrays have no quotes: []\n\n- Numbers must always be unquoted:\n	[10, "value1", 30]\n	{ "key": 1, "key2": "value" }\n\n-Object keys must always be strings (quoted):\n{ "key": 1, "key2": "a", "3": "bcd"} ', popupName); return; }
							break;
						}
						case 'number': {
							try { input = utils.InputBox(window.ID, desc || 'Enter number:', popupName, value, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars, no-empty
							try { input = Number(input); } catch (e) { input = null; } // eslint-disable-line no-unused-vars
							if (Number.isNaN(input)) { fb.ShowPopupMessage('Value must be a number.', popupName); return; }
							break;
						}
						case 'string': {
							try { input = utils.InputBox(window.ID, desc || 'Enter value:', popupName, value, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							break;
						}
						case 'boolean': {
							input = !value;
							break;
						}
					}
					if (value === input) { return; }
					if (!checkProperty(properties[key], input)) { return; } // Apply properties check which should be personalized for input value
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
					if (Object.hasOwn(keySettings, 'popup')) {
						if (type !== 'boolean' || (type === 'boolean' && input)) {
							fb.ShowPopupMessage(keySettings.popup, popupName);
						}
					}
					if (key === 'bIconMode') {
						parent.bIconMode = input;
						window.Repaint();
					}
					if (callbacks) {
						if (Object.hasOwn(callbacks, key)) {
							callbacks[key](input, key);
						} else if (Object.hasOwn(callbacks, '*')) {
							callbacks['*'](input, key);
						}
					}
				}
			});
			if (type === 'boolean') {
				menu.newCheckMenu(void (0), entryText, void (0), () => { return value; });
			}
		});
	}
	if (extraEntries) { extraEntries(menu, this); }
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Restore defaults...', func: () => {
			const options = Object.keys(properties);
			options.forEach((key) => { properties[key][1] = properties[key][3]; });
			overwriteProperties(properties); // Updates panel
			// Fire callbacks since value changing may affect other parts of code which need refreshing
			if (callbacks) {
				options.forEach((key) => {
					if (Object.hasOwn(callbacks, key)) {
						callbacks[key](properties[key][1], key);
					} else if (Object.hasOwn(callbacks, '*')) {
						callbacks['*'](properties[key][1], key);
					}
				});
			}
		}
	});
	if (buttonsBar.readmeList) {
		menu.newSeparator();
		if (readmeFiles.length > 1) {
			const menuName = menu.newMenu('Readmes');
			readmeFiles.forEach((name) => {
				if (Object.hasOwn(buttonsBar.readmeList, name)) {
					menu.newEntry({ menuName, entryText: name.replace('buttons_', ''), func: () => showButtonReadme(name) });
				}
			});
		} else {
			menu.newEntry({ entryText: 'Open readme...', func: () => showButtonReadme(readmeFiles[0]) });
		}
	}
	return menu;
}