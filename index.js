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
            15000
        );
        const modal = await driver.findElement(By.css("div.app-modal"));
        await driver.executeScript("arguments[0].remove();", modal);
        console.log("Pop-up modal found and removed.");
    } catch (error) {
        console.log(
            "Pop-up modal not found or error removing it:",
            error.message
        );
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
        console.log("Retrieving the Case on Hellcase.com...");

        // Check and handle modal after navigating to the URL
        await handleModalIfExists();

        // Initialize arrays to store data
        let skins_global_probas = [];
        let skin_Odds_Value_tuple = [];

        // Wait for page elements to load
        await driver.wait(
            until.elementLocated(By.className("item-wrap")),
            5000
        );

        // Après avoir récupéré tous les éléments "item-wrap"
        let items = await driver.findElements(By.className("item-wrap"));

        // Filtrer pour exclure les éléments qui ont un ancêtre "collapse accordion-item"
        items = await Promise.all(
            items.map(async (item) => {
                let isDescendantOfAccordion = await driver.executeScript(
                    `
        return arguments[0].closest('.collapse.accordion-item') !== null;
    `,
                    item
                );
                return isDescendantOfAccordion ? null : item;
            })
        );

        // Supprimer les éléments null de la liste (ceux qui sont descendants d'un "collapse accordion-item")
        items = items.filter((item) => item !== null);

        let case_length = items.length; // Cette ligne reste inchangée, mais case_length sera maintenant basé sur les items filtrés

        let current_skin = 0;
        let item;
        // Retrieve the case price
        await driver.wait(
            until.elementLocated(By.className("core-price--preset--default")),
            5000
        );

        let case_price_text = await driver
            .findElement(By.className("core-price--preset--default"))
            .getText();

        let case_price = parseFloat(case_price_text.trim().substring(1));

        // Loop to process each item
        for (let i = 0; i < items.length; i++) {
            // Retrieve global probability of the item
            console.log(
                `Retrieving skins probabilities... ${parseInt(
                    ((current_skin + 1) / case_length) * 100
                )}%`
            );

            item = items[i];

            // Check if the item is not descendant of the div with class "accordion-item-header"
            if (item) {
                await driver.wait(
                    until.elementIsVisible(
                        item.findElement(By.className("item-wrap__chance"))
                    ),
                    5000
                );

                let global_proba_text = await item
                    .findElement(By.className("item-wrap__chance"))
                    .findElement(By.css("span:nth-child(2)"))
                    .getText();

                let global_proba =
                    parseFloat(global_proba_text.trim().slice(0, -1)) / 100;

                skins_global_probas.push(global_proba);

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
                let skinsValuesElements = await oddsTable.findElements(
                    By.className("base-price__value")
                );

                let skinsValues = [];
                for (let j = 0; j < skinsValuesElements.length; j++) {
                    let valueElement = skinsValuesElements[j];
                    let skinValue = await valueElement.getText();
                    if (skinValue.trim() !== "") {
                        skinsValues.push(parseFloat(skinValue.trim()));
                    }
                }

                // Retrieve chances of item rarities
                let skinsOdds = [];
                await driver.wait(
                    until.elementLocated(By.className("odds-number")),
                    5000
                );
                let oddsNumbers = await oddsTable.findElements(
                    By.className("odds-number")
                );

                // Start the loop from the second element
                for (let j = 1; j < oddsNumbers.length; j++) {
                    let oddNumberElement = oddsNumbers[j];
                    let skinOdd = await oddNumberElement.getText();
                    if (skinOdd.trim() !== "") {
                        skinsOdds.push(
                            parseFloat(skinOdd.trim().slice(0, -1)) / 100
                        );
                    }
                }
                // Add data to the array
                skin_Odds_Value_tuple.push([skinsValues, skinsOdds]);
                current_skin++;
            }
        }

        console.log("0", skin_Odds_Value_tuple[0]);
        console.log("1", skin_Odds_Value_tuple[1]);
        // Calculate the global expected value
        let case_profitability = 0;
        for (let i = 0; i < skins_global_probas.length; i++) {
            console.log(`Calculating expected value of skin ${i + 1}...`);

            let item_esperance = 0;
            for (let j = 0; j < skin_Odds_Value_tuple[i][0].length; j++) {
                item_esperance +=
                    skin_Odds_Value_tuple[i][0][j] *
                    (skin_Odds_Value_tuple[i][1][j] / skins_global_probas[i]);
            }

            case_profitability += item_esperance * skins_global_probas[i];
        }

        // Display results
        console.log(
            `\nThe expected return value is ${case_profitability.toFixed(2)} $`
        );
        console.log(
            `Minus the case price: ${(case_profitability - case_price).toFixed(
                2
            )} $`
        );
        console.log(
            `Average gain: ${(
                100 *
                ((case_profitability - case_price) / case_price)
            ).toFixed(2)} %`
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
