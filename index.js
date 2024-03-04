// Import required modules
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const chrome = require("selenium-webdriver/chrome");

// Function to prompt user input
async function prompt(question) {
    console.log(question);
    return new Promise((resolve, reject) => {
        process.stdin.resume();
        process.stdin.on("data", function (data) {
            resolve(data.toString().trim());
        });
    });
}

// Self-executing async main function
(async function main() {
    let chosenBrowser = await prompt(
        "Choose a browser (chrome/firefox) or type 'exit' to quit:\n"
    );

    while (true) {
        if (chosenBrowser.toLowerCase() === "exit") {
            console.log("Exiting the script...");
            break;
        }

        // Set options for the chosen browser
        let options;
        if (chosenBrowser === "chrome") {
            options = new chrome.Options();
        } else if (chosenBrowser === "firefox") {
            options = new firefox.Options();
        } else {
            console.log(
                "Unsupported browser. Please choose 'chrome' or 'firefox' or type 'exit' to quit."
            );
            chosenBrowser = await prompt(
                "Choose a browser (chrome/firefox) or type 'exit' to quit:\n"
            );
            continue;
        }

        // options.addArguments("--headless");

        // Initialize Selenium WebDriver for the chosen browser
        let driver = await new Builder()
            .forBrowser(chosenBrowser)
            .setChromeOptions(options)
            .setFirefoxOptions(options)
            .build();

        try {
            // Prompt the user to enter a valid Hellcase link
            driver.manage().setTimeouts({ implicit: 30000 }); // Set implicit wait to 30 seconds
            const url = await prompt("Please enter a valid Hellcase link:\n");

            // Navigate to the provided URL
            await driver.get(url);
            console.log("Retrieving the Case on Hellcase.com...");

            // Initialize arrays to store data
            let items_global_probas = [];
            let items_local_ProbaPrice_tuple = [];

            // Wait for page elements to load
            await driver.wait(
                until.elementLocated(By.className("item-wrap")),
                5000
            );

            // Retrieve "item-wrap" type elements
            let items = await driver.findElements(By.className("item-wrap"));
            let case_number = items.length;
            let current_case = 1;

            // Retrieve the case price
            await driver.wait(
                until.elementLocated(
                    By.className("core-price--preset--default")
                ),
                5000
            );
            let case_price_text = await driver
                .findElement(By.className("core-price--preset--default"))
                .getText();
            let case_price = parseFloat(case_price_text.trim().substring(1));

            // Loop to process each item
            for (let item of items) {
                console.log(
                    `Retrieving global item probabilities... ${parseInt(
                        (current_case / case_number) * 100
                    )}%`
                );

                // Retrieve global probability of the item
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
                items_global_probas.push(global_proba);

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
                let raretesItemValuesElements = await oddsTable.findElements(
                    By.className("base-price__value")
                );

                let raretesItemValues = [];
                for (let valueElement of raretesItemValuesElements) {
                    let valueText = await valueElement.getText();
                    if (valueText.trim() !== "") {
                        raretesItemValues.push(
                            parseFloat(valueText.trim().substring(1))
                        );
                    }
                }

                // Retrieve chances of item rarities
                let chancesraretesItem = [];
                let oddsNumbers = await oddsTable.findElements(
                    By.className("odds-number")
                );

                for (let oddNumberElement of oddsNumbers) {
                    let chanceText = await oddNumberElement.getText();
                    if (chanceText.trim() !== "") {
                        chancesraretesItem.push(
                            parseFloat(chanceText.trim().slice(0, -1)) / 100
                        );
                    }
                }

                // Add data to the array
                items_local_ProbaPrice_tuple.push([
                    raretesItemValues,
                    chancesraretesItem,
                ]);

                current_case++;
            }

            // Calculate the global expected value
            let Global_Items_Esperance = 0;
            for (let i = 0; i < items_global_probas.length; i++) {
                console.log(`Calculating expected value of item ${i + 1}...`);
                let item_esperance = 0;
                for (
                    let j = 0;
                    j < items_local_ProbaPrice_tuple[i][0].length;
                    j++
                ) {
                    item_esperance +=
                        items_local_ProbaPrice_tuple[i][0][j] *
                        items_local_ProbaPrice_tuple[i][1][j];
                }

                Global_Items_Esperance +=
                    item_esperance * items_global_probas[i];
            }

            // Display results
            console.log(
                `\nThe expected value is ${Global_Items_Esperance.toFixed(4)}$`
            );
            console.log(
                `Minus the case price: ${(
                    Global_Items_Esperance - case_price
                ).toFixed(4)}$`
            );
            console.log(
                `Average gain: ${(
                    100 *
                    ((Global_Items_Esperance - case_price) / case_price)
                ).toFixed(4)}%`
            );
        } finally {
            await driver.quit();
        }

        // Prompt the user to choose a browser or exit
        chosenBrowser = await prompt(
            "\nChoose a browser (chrome/firefox) or type 'exit' to quit:\n"
        );
    }

    console.log(
        "Script finished. You can run it again by entering your browser choice."
    );
})();
