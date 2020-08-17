'use strict';

const { getCourseData, getDataFromToss } = require("../lib/scraper.js");
const testStudyData = require("./testStudyData.json");
const testResponse = require("./testTossSearchResponse.json");

describe('scraper', () => {
    it('needs tests', () => {
        expect(1 + 1).toBe(2);
    });

    it('test getCourseData', () => {
        const courseData = getCourseData(testResponse);
        expect(courseData[0].name).toBe("Architekturdokumentation und Präsentation");
    })

    it('test getDataFromToss', async () => {
        const studyData = await getDataFromToss(testStudyData);
        expect(studyData.courses[0].name === "AKANA Funktionalanalysis für TM");
    })
});
