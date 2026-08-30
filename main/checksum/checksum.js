'use strict';
//27/08/26

/* exported checksumUtils */

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _q:readable, dateFormatter:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _exec:readable, _recycleFile:readable, _resolvePath:readable, _save:readable, _jsonParse:readable, _open:readable, utf8:readable */
if (utils.RunCmdAsync) {
	include('..\\..\\helpers\\callbacks_xxx.js');
	include('..\\..\\helpers\\helpers_xxx_prototypes_smp_post.js');
	/* utils.RunCmdAsyncV2 */
}

const checksumUtils = {
	bRunning: false,
	bAbort: false,
	commentRe: /;.*\r?\n?\r?/gim,
	isRunning: () => {
		return this.bRunning;
	},
	abort: () => {
		this.bAbort = true;
	},
	getSelection: function getSelection() {
		return fb.GetFocusItem(true);
	},
	getSelections: function getSelections() {
		return fb.GetSelections(1);
	},
	getSelectionsPaths: function getSelectionsPaths(handleList, bDeduplicate = true) {
		return bDeduplicate
			? Array.from(new Set(fb.TitleFormat('$directory_path(%PATH%)').EvalWithMetadbs(handleList)))
			: fb.TitleFormat('$directory_path(%PATH%)').EvalWithMetadbs(handleList);
	},
	getChecksumPath: function getChecksumPath(handlePath, fileMask) {
		const idx = handlePath.lastIndexOf('\\');
		const parentName = idx === -1 ? '_' : handlePath.slice(idx + 1);
		const fileName = fileMask.replaceAll('%1', parentName);
		const filePath = handlePath + '\\' + fileName;
		return { parentName, fileName, filePath };
	},
	findChecksum: function hasChecksum(handlePath, fileMask) {
		return Array.isArray(handlePath)
			? Array.from(new Set(handlePath)).reduce((prev, path) => _isFile(this.getChecksumPath(path, fileMask).filePath) ? prev + 1 : prev, 0)
			: (_isFile(this.getChecksumPath(handlePath, fileMask).filePath) ? 1 : 0);
	},
	hasChecksum: function hasChecksum(handlePath, fileMask) {
		return Array.isArray(handlePath)
			? Array.from(new Set(handlePath)).every((path) => _isFile(this.getChecksumPath(path, fileMask).filePath))
			: _isFile(this.getChecksumPath(handlePath, fileMask).filePath);
	},
	rewriteChecksumHeader: function rewriteChecksumHeader(paths, header, bReplace) {
		let checksum = _open(paths.filePath, utf8);
		if (bReplace) { checksum = checksum.replace(this.commentRe, ''); }
		checksum = (_jsonParse(_q(header)) || '')
			.replaceAll('%1', paths.parentName)
			.replaceAll('%2', dateFormatter.format(new Date()))
			+ checksum;
		return { checksum, saved: _save(paths.filePath, checksum) };
	},
	showCreateReport: function showCreateReport(results, bShowPopup = false) {
		let report = 'Checksum Tools:\n';
		if (this.bAbort) { report += '\tProcessing was aborted\n'; }
		report += '\t' + results.length + ' processed folders';
		report += '\t' + results.filter((r) => r.checksum === null).length + ' skipped folders';
		report += '\n';
		report += '\t' + results.filter((r) => r.saved).length + ' saved files';
		report += '\t\t' + results.filter((r) => r.overwritten).length + ' overwritten files';
		console.log(report);
		if (bShowPopup || this.bAbort || results.some((r) => r.checksum && !r.saved)) {
			report += '\n\n' + results.map((r) => r.path + '\\' + r.fileName + ' - ' + (r.saved ? 'saved' : (r.checksum === null ? 'skipped' : 'error'))).join('\n');
			fb.ShowPopupMessage(report);
		}
		return report;
	},
	showVerifyReport: function showVerifyReport(results, bShowPopup = true) {
		let report = 'Checksum Tools:\n';
		if (this.bAbort) { report += '\tProcessing was aborted\n'; }
		report += '\t' + results.length + ' processed folders';
		report += '\t' + results.filter((r) => r.errors === null).length + ' skipped folders';
		report += '\n';
		report += '\t' + results.filter((r) => r.pass).length + ' passed';
		report += '\t\t\t' + results.filter((r) => r.errors).length + ' errors';
		console.log(report);
		if (bShowPopup) {
			report += '\n\n' + results.map((r) => r.path + '\\' + r.file + ' - ' + (r.errors ? r.errors + ' errors' : 'passed')).join('\n');
			fb.ShowPopupMessage(report);
		}
		return report;
	},
	showMissingReport: function showMissingReport(results, bShowPopup = true) {
		let report = 'Checksum Tools:\n';
		if (this.bAbort) { report += '\tProcessing was aborted\n'; }
		const missing = results.filter((r) => r.found === false);
		report += '\t' + results.length + ' processed folders';
		report += '\t' + results.filter((r) => r.found === null).length + ' skipped folders';
		report += '\n';
		report += '\t' + missing.length + ' missing';
		console.log(report);
		if (bShowPopup) {
			if (missing.length) {
				report += '\n\nList of missing checksums:';
				report += '\n\n' + results.filter((r) => r.found === false).map((r) => r.path).join('\n');
			}
			fb.ShowPopupMessage(report);
		}
		return report;
	},
	create: function ({
		handleList = this.getSelections(), binPath = folders.xxx + 'exactfile\\exf.exe',
		fileMask = '%1.sfv', args = '-osfv -r -d "%1" -otf "%2" *.*',
		bOverwrite = true, bDelComments = true, header = '', bShowPopup = false,
		parent = void (0)
	} = {}) {
		const bAnimation = parent && Object.hasOwn(parent, 'switchAnimation') && Object.hasOwn(parent, 'stopAllAnimations');
		if (bAnimation) { parent.switchAnimation('Checksum Tools processing selection', true); }
		this.bRunning = true;
		if (handleList && handleList.Count) {
			handleList.Sort();
			const paths = this.getSelectionsPaths(handleList);
			parent.switchAnimation('Checksum Tools processing selection', false);
			return Promise.serial(paths, (path, i) => {
				const animId = 'Checksum Tools processing folder ' + (i + 1) + '/' + paths.length;
				if (bAnimation) { parent.switchAnimation(animId, true); }
				const { parentName, fileName, filePath } = this.getChecksumPath(path, fileMask);
				if (this.bAbort) { return { path, fileName, checksum: null, overwritten: false, saved: false }; }
				const bFound = _isFile(filePath);
				if (bFound && !bOverwrite) { return { path, fileName, checksum: null, overwritten: false, saved: false }; }
				const overwritten = bFound ? _recycleFile(filePath) : false;
				return (
					utils.RunCmdAsyncV2
						? utils.RunCmdAsyncV2(_resolvePath(binPath), ' ' + args.replaceAll('%1', path).replaceAll('%2', filePath))
						: _exec(_resolvePath(binPath) + ' ' + args.replaceAll('%1', path).replaceAll('%2', filePath))
				)
					.then(() => {
						if (bAnimation) { parent.switchAnimation(animId, false); }
						if (_isFile(filePath)) {
							if (bDelComments || header) {
								const { checksum, saved } = this.rewriteChecksumHeader({ parentName, fileName, filePath }, header, bDelComments);
								return { path, fileName, checksum, overwritten, saved };
							}
							console.log('Checksum Tools: ' + fileName);
							return { path, fileName, checksum: '-not available-', overwritten, saved: true };
						}
						return { path, fileName, checksum: null, overwritten: false, saved: false };
					});
			}).then((results) => {
				this.showCreateReport(results, bShowPopup);
				return results;
			}).finally(() => {
				this.bRunning = this.bAbort = false;
				if (bAnimation) { parent.stopAllAnimations(); }
			});
		} else {
			this.bRunning = this.bAbort = false;
			if (bAnimation) { parent.stopAllAnimations(); }
			return Promise.resolve([]);
		}
	},
	verify: function ({
		handleList = this.getSelections(), binPath = folders.xxx + 'exactfile\\exf.exe',
		fileMask = '%1.sfv', args = '-c "%2"',
		parent = void (0)
	} = {}) {
		const bAnimation = parent && Object.hasOwn(parent, 'switchAnimation') && Object.hasOwn(parent, 'stopAllAnimations');
		if (bAnimation) { parent.switchAnimation('Checksum Tools processing selection', true); }
		this.bRunning = true;
		if (handleList && handleList.Count) {
			handleList.Sort();
			const paths = this.getSelectionsPaths(handleList);
			parent.switchAnimation('Checksum Tools processing selection', false);
			const errorRe = /^(\d+)\s[\w\s]*errors/mi;
			return Promise.serial(paths, (path, i) => {
				const animId = 'Checksum Tools verifying folder ' + (i + 1) + '/' + paths.length;
				if (bAnimation) { parent.switchAnimation(animId, true); }
				const idx = path.lastIndexOf('\\');
				const parentName = idx === -1 ? '_' : path.slice(idx + 1);
				const file = fileMask.replaceAll('%1', parentName);
				const filePath = path + '\\' + file;
				if (this.bAbort) { return { path, file, pass: false, errors: null }; }
				const bFound = _isFile(filePath);
				if (!bFound) { return { path, file, pass: false, errors: null }; }
				return (
					utils.RunCmdAsyncV2
						? utils.RunCmdAsyncV2(_resolvePath(binPath), ' ' + args.replaceAll('%1', path).replaceAll('%2', filePath))
						: _exec(_resolvePath(binPath) + ' ' + args.replaceAll('%1', path).replaceAll('%2', filePath))
				)
					.then((out) => {
						if (bAnimation) { parent.switchAnimation(animId, false); }
						if (out) { out = out.trim(); }
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
				this.showVerifyReport(results);
				return results;
			}).finally(() => {
				this.bRunning = this.bAbort = false;
				if (bAnimation) { parent.stopAllAnimations(); }
			});
		} else {
			this.bRunning = this.bAbort = false;
			if (bAnimation) { parent.stopAllAnimations(); }
			return Promise.resolve([]);
		}
	},
	findMissing: function ({
		handleList = this.getSelections(),
		fileMask = '%1.sfv',
		parent = void (0)
	} = {}) {
		const bAnimation = parent && Object.hasOwn(parent, 'switchAnimation') && Object.hasOwn(parent, 'stopAllAnimations');
		if (bAnimation) { parent.switchAnimation('Checksum Tools processing selection', true); }
		this.bRunning = true;
		if (handleList && handleList.Count) {
			handleList.Sort();
			const dic = new Map();
			let paths = new Set();
			this.getSelectionsPaths(handleList, false).forEach((path, i) => {
				if (!paths.has(path)) {
					paths.add(path);
					dic.set(path, i);
				}
			});
			paths = Array.from(paths);
			parent.switchAnimation('Checksum Tools processing selection', false);
			return Promise.serial(paths, (path, i) => {
				const animId = 'Checksum Tools verifying folder ' + (i + 1) + '/' + paths.length;
				if (bAnimation) { parent.switchAnimation(animId, true); }
				if (this.bAbort) { return { path, found: null, handle: null }; }
				return { path, found: _isFile(this.getChecksumPath(path, fileMask).filePath), handle: handleList[dic.get(path)] };
			}).then((results) => {
				this.showMissingReport(results);
				return results;
			}).finally(() => {
				this.bRunning = this.bAbort = false;
				if (bAnimation) { parent.stopAllAnimations(); }
			});
		} else {
			this.bRunning = this.bAbort = false;
			if (bAnimation) { parent.stopAllAnimations(); }
			return Promise.resolve([]);
		}
	},
};