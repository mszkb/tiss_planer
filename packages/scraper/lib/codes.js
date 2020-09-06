/**
 * Returns a prefixed studycode
 */
function checkPrefix(studyCode) {
	const trimmedStudyCode = studyCode.trim();
	if (trimmedStudyCode.charAt(0) === "e") {
		return trimmedStudyCode;
	}
	return `e${trimmedStudyCode}`;
}

module.exports = checkPrefix;
