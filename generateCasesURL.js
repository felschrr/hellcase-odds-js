const { Builder, By } = require('selenium-webdriver');
const fs = require('fs');

async function scrapeHellcase() {
    let options = new firefox.Options();
    options.addArguments("--headless");
    let driver = await new Builder()
        .forBrowser(browser)
        .setFirefoxOptions(options)
        .build();
    try {
        await driver.get('https://hellcase.com/');
        await driver.sleep(5000); // Attente initiale pour que la page charge

        // Faire défiler la page jusqu'au bas pour s'assurer que tous les éléments sont chargés
        let lastHeight = await driver.executeScript('return document.body.scrollHeight');
        while (true) {
            await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
            await driver.sleep(2000); // Attente pour le chargement des éléments
            let newHeight = await driver.executeScript('return document.body.scrollHeight');
            if (newHeight === lastHeight) {
                break;
            }
            lastHeight = newHeight;
        }

        // Collecter les liens
        let elements = await driver.findElements(By.css('a.core-case-main__block'));
        let linksSet = new Set(); // Utiliser un ensemble pour éviter les doublons
        for (let element of elements) {
            let link = await element.getAttribute('href');
            linksSet.add(link); // Ajouter le lien à l'ensemble
        }

        let links = [...linksSet]; // Convertir l'ensemble en tableau

        // Supprimer le fichier JSON s'il existe
        if (fs.existsSync('caseLinks.json')) {
            fs.unlinkSync('caseLinks.json');
        }

        // Sauvegarder dans un fichier JSON
        fs.writeFileSync('caseLinks.json', JSON.stringify(links, null, 2), 'utf-8');
        console.log('Les liens ont été sauvegardés dans caseLinks.json');

    } catch (error) {
        console.error(error);
    } finally {
        await driver.quit();
    }
}

scrapeHellcase();
