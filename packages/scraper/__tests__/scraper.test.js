'use strict';

const { getCourseData, getDataFromToss, listOfAcademicPrograms } = require("../lib/scraper.js");
const testStudyData = require("./testStudyData.json");
const testResponse = require("./testTossSearchResponse.json");

const tissURL = "https://tiss.tuwien.ac.at/curriculum/studyCodes.xhtml";

describe('scraper', () => {
    it('needs tests', () => {
        expect(1 + 1).toBe(2);
    });

    it('check for specific academic programs', async () => {
        const studyCodeStructure = await listOfAcademicPrograms(tissURL);
        const studyToTest = studyCodeStructure.find(e => e.name === "Informatik");
        expect(studyToTest).toBeTruthy();
        expect(studyToTest.studies.length).toBeGreaterThan(1);
        const lvaToTest = studyToTest.studies.find(e => e.name === "Bachelorstudium Technische Informatik");
        expect(lvaToTest).toBeTruthy();
        expect(lvaToTest.code).toBe("033 535");
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
