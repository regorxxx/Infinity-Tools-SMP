'use strict';
//30/01/26

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, VK_CONTROL:readable, folders:readable, MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable, MF_STRING:readable, MF_GRAYED:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, */
include('..\\helpers\\helpers_xxx_file.js');
/* global _foldPath:readable, _isFile:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\checksum\\checksum.js');
/* global checksumUtils:readable */

var prefix = 'chk'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Checksum Tools Button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }],
	binPath: ['Binary path', (_isFile(folders.binaries + 'exactfile\\exf.exe')
		? _foldPath(folders.binaries)
		: folders.xxxRootName + 'helpers-external\\'
	) + 'exactfile\\exf.exe', { func: isStringWeak }],
	binCalcArgs: ['Checksum calculation arguments', '-osfv -r -d "%1" -otf "%2" *.*', { func: isString }],
	binCheckArgs: ['Checksum verification arguments', '-c "%2"', { func: isString }],
	checkFile: ['Checksum file name', '%1.sfv', { func: isString }],
	checkHeader: ['Checksum header (json string)', '', { func: isStringWeak }],
	bDelComments: ['Delete comments', false, { func: isBoolean }],
	bOverwrite: ['Overwrite existing checksum', true, { func: isBoolean }],
	bReportOnCalc: ['Show report on calculation', false, { func: isBoolean }],
};
Object.keys(newButtonsProperties).forEach(p => newButtonsProperties[p].push(newButtonsProperties[p][1]));
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Checksum Tools': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Checksum Tools', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Checksum Tools',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(this, true, ['buttons_utils_checksum.js'], {
					binCalcArgs: { input: 'Enter command line arguments for calculation:\n\n%1 will be replaced with parent folder path.\n%2 will be replaced with checksum file path.' },
					binCheckArgs: { input: 'Enter command line arguments for verification:\n\n%1 will be replaced with parent folder path.\n%2 will be replaced with checksum file path.' },
					checkFile: { input: 'Enter checksum file name:\n\n%1 will be replaced with parent folder name.\n\nIf there is no parent name, it will be replaced with \'_\'.' },
					checkHeader: { input: 'Enter checksum header text (js-compatible string):\n\n%1 will be replaced with parent folder name.\n%2 will be replaced with current date\n\nNote every line of text should be prefixed with \';\' and new lines require \'\\r\\n\'.\n\nWarning: adding a header involves reading and then re-writing the output checksum file (to ensure UTF-8 support).' },
					bDelComments: { popup:'Warning: deleting comment lines involves reading and then re-writing the output checksum file (to ensure UTF-8 support).' },
				});
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				// Menu
				const properties = this.buttonsProperties;
				const menu = new _menu();
				menu.newEntry({
					entryText: 'Create checksum per dir', func: () => {
						checksumUtils.create({
							binPath: properties.binPath[1],
							fileMask: properties.checkFile[1], args: properties.binCalcArgs[1],
							bOverwrite: properties.bOverwrite[1], bDelComments: properties.bDelComments[1], bShowPopup: properties.bReportOnCalc[1],
							header: properties.checkHeader[1],
							parent: this
						});
					}, flags: checksumUtils.isRunning() ? MF_GRAYED : MF_STRING
				});
				menu.newEntry({
					entryText: 'Verify checksum per dir', func: () => {
						checksumUtils.verify({
							binPath: properties.binPath[1],
							fileMask: properties.checkFile[1], args: properties.binCheckArgs[1],
							parent: this
						});
					}, flags: checksumUtils.isRunning() ? MF_GRAYED : MF_STRING
				});
				menu.newSeparator();
				menu.newEntry({
					entryText: 'Abort processing', func: () => {
						checksumUtils.abort();
					}, flags: checksumUtils.isRunning() ? MF_STRING : MF_GRAYED
				});
				menu.newSeparator();
				menu.newEntry({ entryText: 'Settings...', func: () => this.onClick(MK_SHIFT) });
				menu.newSeparator();
				menu.newEntry({ entryText: 'Open readme...', func: () => showButtonReadme('buttons_utils_checksum.js') });
				menu.btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: function () {
			const bCtrl = utils.IsKeyPressed(VK_CONTROL);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			let info = 'Checksum tools for library:';
			// Entries
			if (bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to Save && Backup on demand)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: '\uf1ec'
	})
});