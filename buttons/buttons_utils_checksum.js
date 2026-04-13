'use strict';
//12/04/26

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global VK_CONTROL:readable, folders:readable, MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable, MF_STRING:readable, MF_GRAYED:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isIntInf:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _foldPath:readable, _isFile:readable */
include('..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _textWidth:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\checksum\\checksum.js');
/* global checksumUtils:readable */

var prefix = 'chk'; // NOSONAR[global]

if (!window.ScriptInfo.Name) { window.DefineScript('Checksum Tools Button', { author: 'regorxxx', features: { drag_n_drop: false } }); }

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }],
	bCheckOnSel: ['Icon changes if checksum found', false, { func: isBoolean }],
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
	bTooltipCheck: ['Tooltip shows checksums found', false, { func: isBoolean }],
	checkOnSelLimit: ['Icon/tooltip limit to ≤n dirs', 2000, { func: isIntInf, range: [[0, Infinity]] }],
};
Object.keys(newButtonsProperties).forEach(p => newButtonsProperties[p].push(newButtonsProperties[p][1]));
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Checksum Tools': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _textWidth('Checksum Tools', buttonsBar.config.font.text) + buttonsBar.config.buttonMargin, h: _scale(16, false) },
		text: 'Checksum Tools',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(this, true, ['buttons_utils_checksum.js'], {
					binCalcArgs: { input: 'Enter command line arguments for calculation:\n\n%1 will be replaced with parent folder path.\n%2 will be replaced with checksum file path.' },
					binCheckArgs: { input: 'Enter command line arguments for verification:\n\n%1 will be replaced with parent folder path.\n%2 will be replaced with checksum file path.' },
					checkFile: { input: 'Enter checksum file name:\n\n%1 will be replaced with parent folder name.\n\nIf there is no parent name, it will be replaced with \'_\'.' },
					checkHeader: { input: 'Enter checksum header text (js-compatible string):\n\n%1 will be replaced with parent folder name.\n%2 will be replaced with current date\n\nNote every line of text should be prefixed with \';\' and new lines require \'\\r\\n\'.\n\nWarning: adding a header involves reading and then re-writing the output checksum file (to ensure UTF-8 support).' },
					bDelComments: { popup: 'Warning: deleting comment lines involves reading and then re-writing the output checksum file (to ensure UTF-8 support).' },
					bTooltipCheck: { popup: 'Warning: enabling this option may affect performance when showing the tooltip on large selections, since it will check for checksum files existence at every dir before showing the tooltip.' },
					bCheckOnSel: { popup: 'Warning: enabling this option may affect performance while performing large selections, since UI will be updated on real time after checking for checksum files existence at every dir selected.' },
				}, {
					bCheckOnSel: (val) => {
						this.setCallbacks(this, val);
						this.changeActiveOnSelection();
					}
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
						}).then(() => {
							if (properties.bCheckOnSel[1]) { this.changeActiveOnSelection(); }
						});
					}, flags: checksumUtils.isRunning() ? MF_GRAYED : MF_STRING
				});
				menu.newSeparator();
				menu.newEntry({
					entryText: 'Verify checksum per dir', func: () => {
						checksumUtils.verify({
							binPath: properties.binPath[1],
							fileMask: properties.checkFile[1], args: properties.binCheckArgs[1],
							parent: this
						});
					}, flags: checksumUtils.isRunning() ? MF_GRAYED : MF_STRING
				});
				menu.newEntry({
					entryText: 'Missing checksums per dir', func: () => {
						checksumUtils.findMissing({
							fileMask: properties.checkFile[1],
							parent: this
						}).then((results) => {
							const handleList = new FbMetadbHandleList(results.filter((r) => r.found === false).map((r) => r.handle).filter(Boolean));
							if (handleList.Count) { sendToPlaylist(handleList, 'Checksum Tools: missing', false); }
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
			const cache = this.cache || (this.buttonsProperties.bTooltipCheck[1] ? this.checkSelection() : null);
			if (cache) {
				info += '\nChecksum: ' + cache.foundCount + ' found / ' + cache.fileCount + ' total' +
					(this.buttonsProperties.checkOnSelLimit[1] > 0 && cache.skippedCount > 0 ? ' (' + cache.skippedCount + ' skipped)' : '');
			}
			// Entries
			if (bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to Save && Backup on demand)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: '\uf1ec',
		variables: {
			cache: null,
			checkSelection: function () {
				const handleList = checksumUtils.getSelections();
				handleList.Sort();
				const paths = checksumUtils.getSelectionsPaths(handleList);
				const fileCount = paths.length;
				if (fileCount > this.buttonsProperties.checkOnSelLimit[1]) { paths.length = this.buttonsProperties.checkOnSelLimit[1]; }
				const foundCount = handleList
					? checksumUtils.findChecksum(paths, this.buttonsProperties.checkFile[1])
					: 0;
				return { count: handleList.Count, fileCount, foundCount, skippedCount: fileCount - paths.length };
			},
			changeActiveOnSelection: function () {
				const prev = this.active;
				if (this.buttonsProperties.bCheckOnSel[1]) { this.cache = this.checkSelection(); }
				else { this.cache = null; }
				this.active = this.cache
					? this.cache.foundCount === this.cache.fileCount
					: false;
				if (prev !== this.active) { this.repaint(); }
			},
			eventListeners: [],
			setCallbacks: function (parent, add) {
				if (add) {
					this.eventListeners.push(
						addEventListener('on_metadb_changed', () => {
							this.changeActiveOnSelection();
						}),
						addEventListener('on_selection_changed', () => {
							this.changeActiveOnSelection();
						})
					);
				} else {
					this.eventListeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
				}
			},
		},
		onInit: function () {
			if (this.buttonsProperties.bCheckOnSel[1]) {
				this.setCallbacks(this, true);
				this.changeActiveOnSelection();
			}
		}
	})
});