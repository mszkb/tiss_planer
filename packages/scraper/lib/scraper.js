'use strict';

/**
 * @typedef {Object} Toss
 * @property {String} name
 * @property {String} code
 * @property {String} source
 * @property {Array<Array<String>>} semesterRecommendation
 * @property {Array<tossCourse>} courses
 * @property {Array<Array<String>>}
 *
 * @typedef {Object} Course
 * @property {String} name
 * @property {Float} ects
 * @property {Integer} semesterRecommendation
 *
 * @typedef {Array<study>} studyCodeStructure
 * @typedef {Object} study
 * @property {String} name
 * @property {Array<studies>} studies
 *
 *
 *
 *
 * @typedef {Object} Mapping
 * @property {Integer} tiss_id
 * @property {String} code
 * @property {String} name_de
 * @property {String} group_name
 * @property {String} subject_de
 * @property {Integer} semester
 *
 * @typedef {Object} Human
 * @property {String} tiss
 * @property {String} vowi
 * @property {String} homepage
 * @property {String} tuwel
 *
 * @typedef {Object} tossCourse
 * @property {String} type
 * @property {String} code
 * @property {String} semester
 * @property {String} name_de
 * @property {String} name_en
 * @property {String} course_type
 * @property {Float} ects
 * @property {?} abbr
 * @property {String} language
 * @property {String} first_lecturer_lastname
 * @property {String} scraped_first
 * @property {String} scraped_last
 * @property {Array<Mapping>} mapping
 * @property {Human} human
 */

const puppeteer = require('puppeteer');
const log = require("./logging.js");
const { prefix, semester } = require('./codes.js');
const writeJsonFiles = require('./output');
const HTMLParser = require('node-html-parser');
const $http = require('axios');

const baseURL = "https://tiss.tuwien.ac.at";
const tossURL = code => `https://toss.fsinf.at/api/search?q=${code}`;

/**
 * Workflow:
 * - Get all studies with studycode and name from tiss (studyCodeStructure)
 * - export it as json files to persist it (on github via travis)
 * -
 */
async function scraper() {
    const tissURL = "https://tiss.tuwien.ac.at/curriculum/studyCodes.xhtml";
    await listOfAcademicPrograms(tissURL);
}

/////////////////////////////////////////////////////// TISS - start //
//
// This part is only for tiss
// We create a list of studycodes for further evaluation for TOSS
//

/**
 * Creates a json structure of all available studies of given TISS URL.
 *
 * @param url
 * @param specificStudy - scrape a specific study
 * @return {studyCodeStructure}
 */
const listOfAcademicPrograms = async (url, specificStudy) => {
    let browser;
    const codyCodeSelector = '#studyCodeListForm'
    let studyCodeStructure;
    try {
        log.info("attempt to start browser");
        browser = await puppeteer.launch();
        log.info("browser started successfully");
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector(codyCodeSelector, { timeout: 5000 });

        const body = await page.evaluate(() => {
          return document.querySelector('body').innerHTML;
        });
        const root = HTMLParser.parse(body);
        const studyCodeList = root.querySelectorAll(codyCodeSelector + " .standard.big tbody tr td.studyCodeColumn");

        const studies = root.querySelectorAll(codyCodeSelector);
        studyCodeStructure = studyStructure(studies);

        if (specificStudy) {
            let specific;
            studyCodeStructure.forEach(e => {
                e.studies.forEach(f => {
                    if (f.name === specificStudy) {
                        specific = f;
                    }
                })
            })
            const oida = await getDataFromToss(specific);
            await writeJsonFiles(oida, "curricula");
            studyCodeStructure = oida;
        }

        //writeJsonFiles(studyCodeStructure, "studies");
        //await writeJsonFiles(studyCodeStructure, "curricula")

        // TODO scrape all study codes and save the html
        // TODO create json from the saved html

        browser.close();

      } catch (error) {
        log.error(error);
      } finally {
          if (browser) {
            browser.close();
          }
      }

    return studyCodeStructure;
}

function studyStructure(studies) {
    const htmlTags = studies[0].childNodes;
    const studyTopic = [];
    const studyCodeStructure = [];

    // The html structure alternates between <h2> and <table>
    // h2 begins a new study topic
    // table lists all studies with its codes
    htmlTags.forEach((e) => {
        if (e.tagName === "h2") {
            studyTopic.push({
                "name": e.tagName === "h2" ? e.childNodes[0].rawText : null,
            });
        }
        if (e.tagName === "table") {
            const study = extractStudy(e);
            studyCodeStructure.push(study);
        }
    });

    return studyTopic.map((e, idx) => {
        return {
            "name": e.name,
            "studies": studyCodeStructure[idx]
        }
    });
}

/**
 * @param {HTMLElement} codesHtml
 * @return {studyCodeStructure}
 */
function extractStudy(codesHtml) {
    const allNames = codesHtml.querySelectorAll(".studyCodeNameColumn");
    const allCodes = codesHtml.querySelectorAll(".studyCodeColumn");

    return allNames.map((e, idx) => {
        // get the url out of the href attribute, split by " and take the middle of the splitted array
        const href = e.childNodes[0].rawAttrs.split('"')[1];
        const name = e.rawText.trim();
        const code = allCodes[idx].rawText;
        const source = semester(`${baseURL}${href}`);

        // @type studyCodeStructure
        return {
            name,
            code,
            source
        }
    });
}

/////////////////////////////////////////////////////// TISS - end   //


async function getDataFromToss(studyData) {
    const code = prefix(studyData.code.replace(/ /g, ''));
    const url = tossURL(code);
    const response = await $http.get(url);
    return {
        "code": code,
        "name": studyData.name,
        // todo source from url
        "source": studyData.source,
        "semesterRecommendation": createTossRecommendation(6, response.data, studyData.code),
        "courses": createTossCourse(response.data, studyData.code),
        "groups": []
    };
}

/**
 * @param {Integer} duration - how long does the study take, default: 6 (bakk)
 * @param {tossCourse} courses
 * @param {String} studycode - from tiss
 * @return semesterRecommendation
 */
function createTossRecommendation(duration = 6, courses, studycode) {
    const semesterRecommendation = [...Array(duration)].map(e => []);

    // filter - mapping has item with semester
    const mapped = courses.filter(e => e.mapping.length);
    // sort semester into correct array position of semesterRecommendation
    mapped.forEach((e, x) => {
        const semester = e.mapping.find(e => e.code === studycode).semester
        if(semester) {
            const semesterRecommendationName = `${e.course_type} ${e.name_de}`;
            semesterRecommendation[semester - 1].push(semesterRecommendationName);
        }
    });

    return semesterRecommendation;
}

/**
 * @param response
 * @return Course
 */
function createTossCourse(response, studycode) {
    return response.map(e => {
        return {
            [`${e.course_type} ${e.name_de}`]: {
            "name": e.name_de,
            "ects": e.ects,
            "semesterRecommendation": e.mapping.find(e => e.code === studycode).semester
        }};
    })
}



module.exports = { scraper, getCourseData: createTossCourse, getDataFromToss, listOfAcademicPrograms };
