/**
 * Returns a prefixed studycode
 */
function prefix(studyCode) {
	const trimmedStudyCode = studyCode.trim();
	if (trimmedStudyCode.charAt(0) === "e") {
		return trimmedStudyCode;
	}
	return `e${trimmedStudyCode}`;
}

function semester(url) {
	return url.replace("curriculum.xhtml", "curriculumSemester.xhtml");
}

module.exports = { prefix, semester };
