const { Builder, By, until } = require("selenium-webdriver");
const caseLinks = require("./caseLinks.json");
const firefox = require("selenium-webdriver/firefox");
const fs = require("fs");
const path = require("path");

let chosenBrowser = "firefox";
let driver;

async function initializeDriver(browser) {
    let options = new firefox.Options();
    options.addArguments("--headless");
    driver = await new Builder()
        .forBrowser(browser)
        .setFirefoxOptions(options)
        .build();
}

async function handleModalIfExists() {
    try {
        await driver.wait(
            until.elementLocated(By.className("app-modal")),
            5000
        );
        const modal = await driver.findElement(By.css("div.app-modal"));
        await driver.executeScript("arguments[0].remove();", modal);
        console.log("Pop-up modal found and removed.");
    } catch (error) {
        console.log("Pop-up modal not found or error removing it");
    }
}

// Ensure the results file directory exists and open the file for writing
function ensureResultsFile() {
    const resultsPath = path.join(__dirname, "profitabilityResults.csv");
    try {
        if (!fs.existsSync(resultsPath)) {
            // Write the headers if the file doesn't exist
            fs.writeFileSync(
                resultsPath,
                "Case Name,Expected Return,Net Profit,Average Gain (%)\n",
                { flag: "wx" }
            );
        }
    } catch (err) {
        console.error(
            "An error occurred while initializing the results file:",
            err
        );
    }
    return resultsPath;
}

(async function main() {
    await initializeDriver(chosenBrowser);
    const resultsPath = ensureResultsFile();

    for (let link of caseLinks) {
        let caseName = link
            .split("/")
            .pop()
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        try {
            await driver.get(link);
            console.log(`Loading the case ${caseName} from Hellcase.com...`);

            await handleModalIfExists();
            let globalSkinProbabilities = [];
            let skinOddsValueTuple = [];

            await driver.wait(
                until.elementLocated(By.className("item-wrap")),
                5000
            );
            let items = await driver.findElements(By.className("item-wrap"));
            items = await Promise.all(
                items.map(async (item) => {
                    let isDescendantOfAccordion = await driver.executeScript(
                        `return arguments[0].closest('.collapse.accordion-item') !== null;`,
                        item
                    );
                    return isDescendantOfAccordion ? null : item;
                })
            );
            items = items.filter((item) => item !== null);
            let caseLength = items.length;

            await driver.wait(
                until.elementLocated(
                    By.className("core-price--preset--default")
                ),
                5000
            );
            let casePriceText = await driver
                .findElement(By.className("core-price--preset--default"))
                .getText();
            let casePrice = parseFloat(casePriceText.trim().substring(1));

            for (let item of items) {
                if (item) {
                    await driver.wait(
                        until.elementIsVisible(
                            item.findElement(By.className("item-wrap__chance"))
                        ),
                        5000
                    );
                    let globalProbabilityText = await item
                        .findElement(By.className("item-wrap__chance"))
                        .findElement(By.css("span:nth-child(2)"))
                        .getText();
                    let globalProbability =
                        parseFloat(globalProbabilityText.trim().slice(0, -1)) /
                        100;
                    globalSkinProbabilities.push(globalProbability);

                    await item
                        .findElement(By.className("item-wrap__button"))
                        .click();
                    await driver.wait(
                        until.elementLocated(By.className("odds-table")),
                        5000
                    );
                    let oddsTable = await driver.findElement(
                        By.className("odds-table")
                    );

                    let skinValuesElements = await oddsTable.findElements(
                        By.className("base-price__value")
                    );
                    let skinValues = [];
                    for (let valueElement of skinValuesElements) {
                        let skinValue = await valueElement.getText();
                        if (skinValue.trim() !== "") {
                            skinValues.push(parseFloat(skinValue.trim()));
                        }
                    }

                    let skinOdds = [];
                    let oddsNumbers = await oddsTable.findElements(
                        By.className("odds-number")
                    );
                    for (let j = 1; j < oddsNumbers.length; j++) {
                        let skinOdd = await oddsNumbers[j].getText();
                        if (skinOdd.trim() !== "") {
                            skinOdds.push(
                                parseFloat(skinOdd.trim().slice(0, -1)) / 100
                            );
                        }
                    }
                    skinOddsValueTuple.push([skinValues, skinOdds]);
                }
            }

            let caseProfitability = 0;
            for (let i = 0; i < globalSkinProbabilities.length; i++) {
                let itemExpectancy = 0;
                for (let j = 0; j < skinOddsValueTuple[i][0].length; j++) {
                    itemExpectancy +=
                        skinOddsValueTuple[i][0][j] *
                        (skinOddsValueTuple[i][1][j] /
                            globalSkinProbabilities[i]);
                }
                caseProfitability +=
                    itemExpectancy * globalSkinProbabilities[i];
            }

            const profitabilityData = `${caseName},${caseProfitability.toFixed(
                2
            )},${(caseProfitability - casePrice).toFixed(2)},${(
                100 *
                ((caseProfitability - casePrice) / casePrice)
            ).toFixed(2)}\n`;
            fs.appendFileSync(resultsPath, profitabilityData);
            console.log(`Results for ${caseName} saved.`);
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
    
    driver.quit();
})();
