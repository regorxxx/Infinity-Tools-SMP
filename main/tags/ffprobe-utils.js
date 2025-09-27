'use strict';
//27/09/24

/* exported ffprobeUtils */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, folders:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, WshShell:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _q:readable */

const ffprobeUtils = {
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
		if (!this.testPath()) { this.path = null; }
		else {
			this.path = Array.isArray(this.paths)
				? this.paths.find((path) => _isFile(path)) || null
				: this.paths || null;
		}
		return this.path;
	},
	getTagsFromFile: function getTagsFromFile(file, tagName = globTags.acoustidFP, undefinedVal = '') {
		if (!this.path && !this.getPath()) { return Promise.reject(new Error('ffprobe executable not found')); }
		return this.exec(_q(this.path) + ' -v quiet -print_format json -show_entries format_tags=' + tagName + ' -i ' + _q(file))
			.then((resolve) => {
				const data = resolve ? JSON.parse(resolve) : null;
				const tags = data && data.format && data.format.tags ? data.format.tags : { [tagName]: undefinedVal };
				return tags;
			}, (error) => {
				return Promise.reject(error); // NOSONAR
			});
	},
	getTags: function getTags(handleList, tagName = globTags.acoustidFP) {
		if (!this.path && !this.getPath()) { return Promise.reject(new Error('ffprobe executable not found')); }
		const paths = handleList.Convert().map((h) => h.Path);
		const tags = paths.map((path) => this.getTagsFromFile(path, tagName));
		return Promise.all(tags).then((values) => {
			return values;
		});
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