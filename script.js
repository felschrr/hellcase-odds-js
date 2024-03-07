/*
    Script inspired by @Pajul7's original creation.
    @author felschrr
*/

// Import required modules
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const chrome = require("selenium-webdriver/chrome");

// Function to prompt user input
async function prompt(question) {
    console.log(question);
    return new Promise((resolve, reject) => {
        process.stdin.resume();
        process.stdin.once("data", function (data) {
            resolve(data.toString().trim());
        });
    });
}

// Initialize a variable to store the chosen browser outside the main function
let chosenBrowser = null;

// Initialize WebDriver outside of the main function to reuse the browser session
let driver;

// Function to initialize the WebDriver
async function initializeDriver(browser) {
    let options;
    if (browser === "chrome") {
        options = new chrome.Options();
    } else if (browser === "firefox") {
        options = new firefox.Options();
    }

    options.addArguments("--headless");

    driver = await new Builder()
        .forBrowser(browser)
        .setChromeOptions(options)
        .setFirefoxOptions(options)
        .build();
}

// Function to handle modal if it exists
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

// Self-executing async main function
(async function main() {
    if (chosenBrowser === null) {
        chosenBrowser = await prompt(
            "Choose a browser (chrome/firefox) or type 'exit' to quit:\n"
        );
        if (chosenBrowser.toLowerCase() === "exit") {
            console.log("Exiting the script...");
            process.exit();
        }

        await initializeDriver(chosenBrowser);
    }

    try {
        const url = await prompt("Please enter a valid URL:\n");
        await driver.get(url);
        console.log("Loading the case from Hellcase.com...");

        // Check and handle modal after navigating to the URL
        await handleModalIfExists();

        // Initialize arrays to store data
        let globalSkinProbabilities = [];
        let skinOddsValueTuple = [];

        // Wait for page elements to load
        await driver.wait(
            until.elementLocated(By.className("item-wrap")),
            5000
        );

        // After retrieving all the "item-wrap" elements
        let items = await driver.findElements(By.className("item-wrap"));

        // Filter to exclude elements that have an ancestor "collapse accordion-item"
        items = await Promise.all(
            items.map(async (item) => {
                let isDescendantOfAccordion = await driver.executeScript(
                    `return arguments[0].closest('.collapse.accordion-item') !== null;`,
                    item
                );
                return isDescendantOfAccordion ? null : item;
            })
        );

        // Remove null elements from the list (those that are descendants of a "collapse accordion-item")
        items = items.filter((item) => item !== null);

        let caseLength = items.length; // This line remains unchanged but caseLength is now based on filtered items

        let currentSkin = 0;
        let item;
        // Retrieve the case price
        await driver.wait(
            until.elementLocated(By.className("core-price--preset--default")),
            5000
        );

        let casePriceText = await driver
            .findElement(By.className("core-price--preset--default"))
            .getText();

        let casePrice = parseFloat(casePriceText.trim().substring(1));

        // Loop to process each item
        for (let i = 0; i < items.length; i++) {
            // Retrieve global probability of the item
            console.log(
                `Retrieving skin probabilities... (${i + 1}/${caseLength})`
            );

            item = items[i];

            // Check if the item is not a descendant of the div with class "accordion-item-header"
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
                    parseFloat(globalProbabilityText.trim().slice(0, -1)) / 100;

                globalSkinProbabilities.push(globalProbability);

                // Click on the item button to see details
                await driver.wait(
                    until.elementLocated(By.className("item-wrap__button")),
                    5000
                );
                await item
                    .findElement(By.className("item-wrap__button"))
                    .click();

                // Wait and retrieve values and chances of item rarities
                await driver.wait(
                    until.elementLocated(By.className("odds-table")),
                    5000
                );
                let oddsTable = await driver.findElement(
                    By.className("odds-table")
                );

                // Retrieve values of item rarities
                await driver.wait(
                    until.elementLocated(By.className("base-price__value")),
                    5000
                );
                let skinValuesElements = await oddsTable.findElements(
                    By.className("base-price__value")
                );

                let skinValues = [];
                for (let j = 0; j < skinValuesElements.length; j++) {
                    let valueElement = skinValuesElements[j];
                    let skinValue = await valueElement.getText();
                    if (skinValue.trim() !== "") {
                        skinValues.push(parseFloat(skinValue.trim()));
                    }
                }

                // Retrieve chances of item rarities
                let skinOdds = [];
                await driver.wait(
                    until.elementLocated(By.className("odds-number")),
                    5000
                );
                let oddsNumbers = await oddsTable.findElements(
                    By.className("odds-number")
                );

                // Start the loop from the second element
                for (let j = 1; j < oddsNumbers.length; j++) {
                    let oddsNumberElement = oddsNumbers[j];
                    let skinOdd = await oddsNumberElement.getText();
                    if (skinOdd.trim() !== "") {
                        skinOdds.push(
                            parseFloat(skinOdd.trim().slice(0, -1)) / 100
                        );
                    }
                }
                // Add data to the array
                skinOddsValueTuple.push([skinValues, skinOdds]);
                currentSkin++;
            }
        }

        // Calculate the global expected value
        let caseProfitability = 0;
        for (let i = 0; i < globalSkinProbabilities.length; i++) {
            console.log(
                `Calculating expected value of skin ${i + 1}/${caseLength}...`
            );
            let totalConditionalProbability = 0;
            for (let j = 0; j < skinOddsValueTuple[i][0].length; j++) {
                totalConditionalProbability += skinOddsValueTuple[i][1][j];
            }
            // Check if the sum of conditional probabilities is close to 1 (or 100%).
            if (Math.abs(totalConditionalProbability - 1) > 0.01) {
                console.warn(`Conditional probabilities sum for this ${caseName} case is not close to 1.`);
            }
            let itemExpectancy = 0;
            for (let j = 0; j < skinOddsValueTuple[i][0].length; j++) {
                itemExpectancy +=
                    skinOddsValueTuple[i][0][j] *
                    (skinOddsValueTuple[i][1][j] / globalSkinProbabilities[i]);
            }
            caseProfitability += itemExpectancy * globalSkinProbabilities[i];
        }

        // Display results
        console.log(
            `\nThe expected return value is $${caseProfitability.toFixed(2)}`
        );
        console.log(
            `Minus the case price: $${(caseProfitability - casePrice).toFixed(
                2
            )}`
        );
        console.log(
            `Average gain: ${(
                100 *
                ((caseProfitability - casePrice) / casePrice)
            ).toFixed(2)}%`
        );
    } catch (error) {
        console.error("An error occurred:", error);
    }

    // Optionally, prompt the user to continue or exit
    const continueOrExit = await prompt(
        "Type 'exit' to quit or press Enter to continue with the same browser:\n"
    );
    if (continueOrExit.toLowerCase() !== "exit") {
        // Call the main function again to restart the process
        await main();
    } else {
        console.log("Exiting the script...");
        process.exit();
    }
})();
