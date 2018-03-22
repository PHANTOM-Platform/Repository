
//source: https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync
const fs = require('fs');
const path = require('path');

/**
* Default, make directories relative to current working directory.
*
* @example 
* // Make directories relative to the current script.
* mkDirFullPathSync('path/to/dir', {isRelativeToScript: true});
*
* @example 
* // Make directories with an absolute path.
* mkDirFullPathSync('/path/to/dir');
*/
module.exports = {
	mkDirFullPathSync: function (targetDir, {isRelativeToScript = false} = {}) {
		const sep = path.sep;
		const initDir = path.isAbsolute(targetDir) ? sep : '';
		const baseDir = isRelativeToScript ? __dirname : '.';

		targetDir.split(sep).reduce((parentDir, childDir) => {
			const curDir = path.resolve(baseDir, parentDir, childDir);
			try {
				fs.mkdirSync(curDir);
// 				console.log(`Directory ${curDir} created!`);
			} catch (err) {
				if (err.code !== 'EEXIST') {
					throw err;
				}
// 				console.log(`Directory ${curDir} already exists!`);
			}
			return curDir;
		}, initDir);
	}//end mkDirFullPathSync
}
