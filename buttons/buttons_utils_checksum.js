'use strict';
//28/01/26

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, VK_CONTROL:readable, folders:readable, MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable, MF_STRING:readable, MF_GRAYED:readable, dateFormatter:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, _q:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _foldPath:readable, _isFile:readable, _exec:readable, _recycleFile:readable, _resolvePath:readable, _save:readable, _jsonParse:readable, _open:readable, utf8:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */

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
				const menu = new _menu();
				menu.newEntry({
					entryText: 'Create checksum per dir', func: () => {
						this.switchAnimation('Checksum Tools processing selection', true);
						this.bRunning = true;
						const handleList = fb.GetSelections(1);
						if (handleList && handleList.Count) {
							handleList.Sort();
							const commentRe = /;.*\r?\n?\r?/gim;
							const paths = [...new Set(fb.TitleFormat('$directory_path(%PATH%)').EvalWithMetadbs(handleList))];
							this.switchAnimation('Checksum Tools processing selection', false);
							Promise.serial(paths, (path, i) => {
								const animId = 'Checksum Tools processing folder ' + (i + 1) + '/' + paths.length;
								this.switchAnimation(animId, true);
								const idx = path.lastIndexOf('\\');
								const parentName = idx !== -1 ? path.slice(idx + 1) : '_';
								const file = this.buttonsProperties.checkFile[1].replaceAll('%1', parentName);
								const filePath = path + '\\' + file;
								if (this.bAbort) { return { path, file, checksum: null, overwritten: false, saved: false }; }
								const bFound = _isFile(filePath);
								if (bFound && !this.buttonsProperties.bOverwrite[1]) { return { path, file, checksum: null, overwritten: false, saved: false }; }
								const overwritten = bFound ? _recycleFile(filePath) : false;
								return _exec(_resolvePath(this.buttonsProperties.binPath[1]) + ' ' + this.buttonsProperties.binCalcArgs[1].replaceAll('%1', path).replaceAll('%2', filePath))
									.then(() => {
										this.switchAnimation(animId, false);
										if (_isFile(filePath)) {
											if (this.buttonsProperties.bDelComments[1] || this.buttonsProperties.checkHeader[1]) {
												let checksum = _open(filePath, utf8);
												if (this.buttonsProperties.bDelComments[1]) { checksum = checksum.replace(commentRe, ''); }
												checksum = (_jsonParse(_q(this.buttonsProperties.checkHeader[1])) || '')
													.replaceAll('%1', parentName)
													.replaceAll('%2', dateFormatter.format(new Date()))
													+ checksum;
												const saved = _save(filePath, checksum);
												return { path, file, checksum, overwritten, saved };
											}
											console.log('Checksum Tools: ' + file);
											return { path, file, checksum: '-not available-', overwritten, saved: true };
										}
										return { path, file, checksum: null, overwritten: false, saved: false };
									});
							}).then((results) => {
								let report = 'Checksum Tools:\n';
								if (this.bAbort) { report += '\tProcessing was aborted\n'; }
								report += '\t' + results.length + ' processed folders';
								report += '\t' + results.filter((r) => r.checksum === null).length + ' skipped folders';
								report += '\n';
								report += '\t' + results.filter((r) => r.saved).length + ' saved files';
								report += '\t\t' + results.filter((r) => r.overwritten).length + ' overwritten files';
								console.log(report);
								if (this.buttonsProperties.bReportOnCalc[1] || this.bAbort || results.some((r) => r.checksum && !r.saved)) {
									report += '\n\n' + results.map((r) => r.path + '\\' + r.file + ' - ' + (r.saved ? 'saved' : (r.checksum === null ? 'skipped' : 'error'))).join('\n');
									fb.ShowPopupMessage(report);
								}
							}).finally(() => {
								this.bRunning = this.bAbort = false;
								this.stopAllAnimations();
							});
						} else {
							this.bRunning = this.bAbort = false;
							this.stopAllAnimations();
						}
					}, flags: this.bRunning ? MF_GRAYED : MF_STRING
				});
				menu.newEntry({
					entryText: 'Verify checksum per dir', func: () => {
						this.switchAnimation('Checksum Tools processing selection', true);
						this.bRunning = true;
						const handleList = fb.GetSelections(1);
						if (handleList && handleList.Count) {
							handleList.Sort();
							const paths = [...new Set(fb.TitleFormat('$directory_path(%PATH%)').EvalWithMetadbs(handleList))];
							this.switchAnimation('Checksum Tools processing selection', false);
							const errorRe = /^(\d+).*errors/mi;
							Promise.serial(paths, (path, i) => {
								const animId = 'Checksum Tools verifying folder ' + (i + 1) + '/' + paths.length;
								this.switchAnimation(animId, true);
								const idx = path.lastIndexOf('\\');
								const parentName = idx !== -1 ? path.slice(idx + 1) : '_';
								const file = this.buttonsProperties.checkFile[1].replaceAll('%1', parentName);
								const filePath = path + '\\' + file;
								if (this.bAbort) { return { path, file, pass: false, errors: null }; }
								const bFound = _isFile(filePath);
								if (!bFound) { return { path, file, pass: false, errors: null }; }
								return _exec(_resolvePath(this.buttonsProperties.binPath[1]) + ' ' + this.buttonsProperties.binCheckArgs[1].replaceAll('%1', path).replaceAll('%2', filePath))
									.then((out) => {
										this.switchAnimation(animId, false);
										if (out) { out = out.trim(); }
										console.log(out);
										if (out && out.length) {
											const errors = errorRe.exec(out);
											if (errors && errors[1]) {
												console.log('Checksum Tools: ' + file + ' - ' + errors[1] + ' errors found');
												return { path, file, pass: false, errors: errors[1] };
											}
										}
										console.log('Checksum Tools: ' + file);
										return { path, file, pass: true, errors: 0 };
									});
							}).then((results) => {
								let report = 'Checksum Tools:\n';
								if (this.bAbort) { report += '\tProcessing was aborted\n'; }
								report += '\t' + results.length + ' processed folders';
								report += '\t' + results.filter((r) => r.errors === null).length + ' skipped folders';
								report += '\n';
								report += '\t' + results.filter((r) => r.pass).length + ' passed';
								report += '\t\t\t' + results.filter((r) => r.errors).length + ' errors';
								console.log(report);
								report += '\n\n' + results.map((r) => r.path + '\\' + r.file + ' - ' + (r.errors ? r.errors + ' errors' : 'passed')).join('\n');
								fb.ShowPopupMessage(report);
							}).finally(() => {
								this.bRunning = this.bAbort = false;
								this.stopAllAnimations();
							});
						} else {
							this.bRunning = this.bAbort = false;
							this.stopAllAnimations();
						}
					}, flags: this.bRunning ? MF_GRAYED : MF_STRING
				});
				menu.newSeparator();
				menu.newEntry({
					entryText: 'Abort processing', func: () => {
						this.bAbort = true;
					}, flags: this.bRunning ? MF_STRING : MF_GRAYED
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
		icon: '\uf1ec',
		variables: {
			bAbort: false,
			bRunning: false,
		}
	})
});