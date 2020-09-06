const replaceUmlaute = require('./umlauts.js');
const path = require('path');
const fs = require('fs-extra');

async function writeJsonFiles(studyCodeStructure, dir = "studies") {
	if(dir === undefined) {
		throw new Error("dir param is mandatory, use 'studies' or 'curricula'")
	}

	if(dir === "studies") {
		studyCodeStructure.forEach(e => {
			const fileName = replaceUmlaute(e.name.replace(/ /g, '-').toLowerCase() + ".json");
			const filePath = path.join(__dirname, `/../studies/`, fileName);
			fs.outputJson(filePath, JSON.stringify(e));
		})
	}

	if(dir === "curricula") {
		const codeTrimmed = studyCodeStructure.code.replace(/ /g, '');
		const fileName = codeTrimmed + ".json";
		const filePath = path.join(__dirname, `/../curricula/`, fileName);
		await fs.outputJson(filePath, studyCodeStructure);
	}
}

module.exports = writeJsonFiles;
