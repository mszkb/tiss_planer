'use strict';

const puppeteer = require('puppeteer');
const log = require("./logging.js");
const replaceUmlaute = require('./umlauts.js')
const HTMLParser = require('node-html-parser');
const path = require('path');
const fs = require('fs');
const $http = require('axios');

const baseURL = "https://tiss.tuwien.ac.at";
const tossURL = code => `https://toss.fsinf.at/api/search?q=${code}`;



async function scraper() {
    // TODO
    const testUrl = "https://tiss.tuwien.ac.at/curriculum/studyCodes.xhtml?dswid=4103&dsrid=863";
    await listOfAcademicPrograms(testUrl);
}

const listOfAcademicPrograms = async url => {
    let browser;
    const codyCodeSelector = '#studyCodeListForm'

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
        const studyCodeStructure = createDatastructure(studies);
        
        //writeJsonFiles(studyCodeStructure, "studies");
        await writeJsonFiles(studyCodeStructure, "curricula")

        browser.close();
      } catch (error) { 
        log.error(error);
      } finally {
          if (browser) {
            browser.close();
          }
      }
}

async function writeJsonFiles(studyCodeStructure, dir = "studies") {
    if(dir === undefined) {
        log.error("dir param is mandatory, use 'studies' or 'curricula'")
    }

    if(dir === "studies") {
        studyCodeStructure.forEach(e => {
            const fileName = replaceUmlaute(e.name.replace(/ /g, '-').toLowerCase() + ".json");
            const filePath = path.join(__dirname, `/../studies/`, fileName);
            fs.writeFileSync(filePath, JSON.stringify(e));
        })
    }

    if(dir === "curricula") {
        studyCodeStructure.forEach(e => {
            e.studies.forEach(async f => {
                const study = await getDataFromToss(f);
                const codeTrimmed = f.code.replace(/ /g, '');
                const fileName = codeTrimmed + ".json";
                const filePath = path.join(__dirname, `/../curricula/`, "e" + fileName);
                fs.writeFileSync(filePath, JSON.stringify(study));
            })
        })
    }
}

async function getDataFromToss(studyData) {
    const code = studyData.code.replace(/ /g, '');
    const url = tossURL("e" +code);
    const response = await $http.get(url);
    return {
        "code": code,
        "name": studyData.name,
        "source": "",
        "semesterRecommendation": [],
        "courses": getCourseData(response.data)
    };
}

function getCourseData(reponse) {
    return reponse.map(e => {
        // TODO use name as the object key like in https://www.fsinf.at/files/curricula/e033526.json
        return {
            "name": e.name_de,
            "ects": e.ects,
            "semesterRecommendation": 0
        }
    })
}

function createDatastructure(studies) {
    const htmlTags = studies[0].childNodes;
    const studyTopic = [];
    const studyCodeStructure = [];

    htmlTags.forEach((e) => {
        if (e.tagName === "h2") {
            studyTopic.push({
                "name": extractStudyTopic(e),
            });
        }
        if (e.tagName === "table") {
            studyCodeStructure.push(extractStudyCodes(e));
        }
    });

    return studyTopic.map((e, idx) => {
        return {
            "name": e.name,
            "studies": studyCodeStructure[idx]
        }
    });
}

function extractStudyTopic(h2) {
    if (h2.tagName === "h2") {
        return h2.childNodes[0].rawText;
    }
}

function extractStudyCodes(codesHtml) {
    const allNames = codesHtml.querySelectorAll(".studyCodeNameColumn");
    const allCodes = codesHtml.querySelectorAll(".studyCodeColumn");

    return allNames.map((e, idx) => {
        // get the url out of the href attribute, split by " and take the middle of the splitted array
        const href = e.childNodes[0].rawAttrs.split('"')[1];
        return {
            "name": e.rawText.trim(),
            "code": allCodes[idx].rawText,
            "link": `${baseURL}${href}`,
        }
    });
}




module.exports = { scraper, getCourseData, getDataFromToss };