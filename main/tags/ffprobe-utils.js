'use strict';
//21/09/26

/* exported ffprobeUtils */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, folders:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, WshShell:readable, _jsonParse */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _q:readable */

const ffprobeUtils = {
	omitFiles: /\.(iso|zip|rar|7z)$/i,
	paths: [
		folders.binaries + 'ffprobe\\ffprobe_32.exe',
		folders.xxx + 'helpers-external\\ffprobe\\ffprobe_32.exe',
		folders.binaries + 'ffprobe\\ffprobe.exe',
		folders.xxx + 'helpers-external\\ffprobe\\ffprobe.exe',
	],
	path: null,
	testPath: function testPath() {
		if (Array.isArray(this.paths)) {
			if (!this.paths.some((path) => _isFile(path))) {
				fb.ShowPopupMessage('ffprobe executable not found at:\n' + this.paths.join('\n'), 'ffprobe Utils');
				return false;
			}
		} else if (!_isFile(this.paths)) {
			fb.ShowPopupMessage('ffprobe executable not found at:\n' + this.paths, 'ffprobe Utils');
			return false;
		}
		return true;
	},
	getPath: function getPath() {
		if (this.testPath()) {
			this.path = Array.isArray(this.paths)
				? this.paths.find((path) => _isFile(path)) || null
				: this.paths || null;
		} else { this.path = null; }
		return this.path;
	},
	isCompatibleFile: function isCompatibleFile(file) {
		return !this.omitFiles.test(file);
	},
	getTagsFromFile: function getTagsFromFile(file, tagName = globTags.acoustidFP, undefinedVal = '') {
		if (!this.path && !this.getPath()) { return Promise.reject(new Error('ffprobe executable not found')); }
		if (!this.isCompatibleFile(file)) { return  { [tagName]: undefinedVal }; }
		return (
			utils.RunCmdAsyncV2
				? utils.RunCmdAsyncV2(this.path, ' -v quiet -print_format json -show_entries format_tags=' + tagName + ' -i ' + _q(file))
				: this.exec(_q(this.path) + ' -v quiet -print_format json -show_entries format_tags=' + tagName + ' -i ' + _q(file))
		).then((resolve) => {
			const data = resolve ? _jsonParse(resolve) : null;
			const tags = data && data.format && data.format.tags
				? { [tagName]: Object.values(data.format.tags)[0] || undefinedVal } // ffprobe tag name may not match original one regarding casing
				: { [tagName]: undefinedVal };
			return tags;
		}, () => {
			throw new Error('Failed file: ' + file);
		});
	},
	getTags: function getTags(handleList, tagName = globTags.acoustidFP) {
		if (!this.path && !this.getPath()) { return Promise.reject(new Error('ffprobe executable not found')); }
		const paths = handleList.Convert().map((h) => h.Path);
		const tags = paths.map((path) => this.getTagsFromFile(path, tagName));
		return Promise.all(tags);
	},
	exec: function exec(command) {
		const execObj = WshShell.Exec(command);
		return new Promise((res, rej) => {
			setTimeout(() => {
				switch (execObj.Status) {
					case 2: rej(execObj.StdErr.ReadAll()); break;
					case 1:
					default: { // Buffer gets broken with large tags and have to force reading it
						const data = execObj.StdOut.ReadAll();
						if (data) { res(data); } else { rej(new Error('ffprobe failed reading data')); }
					}
				}
			}, 0);
		});
	}
};