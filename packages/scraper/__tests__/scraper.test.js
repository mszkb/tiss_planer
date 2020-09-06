'use strict';

const { getCourseData, getDataFromToss, listOfAcademicPrograms } = require("../lib/scraper.js");
const testStudyData = require("./testStudyData.json");
const testResponse = require("./testTossSearchResponse.json");
const fs = require('fs-extra');
const path = require('path');

const tissURL = "https://tiss.tuwien.ac.at/curriculum/studyCodes.xhtml";

describe('scraper', () => {
    it('check for specific academic programs', async () => {
        const studyCodeStructure = await listOfAcademicPrograms(tissURL);
        const studyToTest = studyCodeStructure.find(e => e.name === "Informatik");
        expect(studyToTest).toBeTruthy();
        expect(studyToTest.studies.length).toBeGreaterThan(1);
        const lvaToTest = studyToTest.studies.find(e => e.name === "Bachelorstudium Technische Informatik");
        expect(lvaToTest).toBeTruthy();
        expect(lvaToTest.code).toBe("033 535");
    });

    it('check full run with single sutdy', async () => {
        const singleStudy = await listOfAcademicPrograms(tissURL, "Bachelorstudium Medieninformatik und Visual Computing");

        // test if file is created
        const file = path.join(__dirname, '/../curricula/', `${singleStudy.code}.json`)
        const data = await fs.readJson(file);
        const code = data.code;

        expect(code).toBe("e033532");
        expect(data).toMatchSnapshot();
    })

    it('test getCourseData', () => {
        const courseData = getCourseData(testResponse);
        expect(courseData[0].name).toBe("Architekturdokumentation und Präsentation");
    })

    it('test getDataFromToss', async () => {
        const studyData = await getDataFromToss({
            code: "033 526",
            name: "Wirschaftsinformatik",
            source: "https://tiss.tuwien.ac.at/curriculum/public/curriculumFileDownload.xhtml?date=20191001T000000&key=45300"
        });
        expect(studyData.courses[0]["VO 3D Vision"].name).toBe("3D Vision");
    })
});
