<<<<<<< HEAD

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Selenium](https://img.shields.io/badge/-selenium-%43B02A?style=for-the-badge&logo=selenium&logoColor=white)

# Hellcase Odds JS

Javascript porting of this [hellcase-odds](https://github.com/Pajul7/hellcase-odds) repo made by [Pajul7](https://github.com/Pajul7)

### Node.js script to calculate the profitability of Hellcase cases

## Features

* Calcultate the profitability of a certain case (`script.js`)
* Generate all cases URL in a .json file (`generateCasesURL.js`)
* Calculate the profitability of all cases and generate a .csv file structured such as Case Name, Expected Return, Net Profit, Average Gain (%) (`generateAllCases.js`)
=======
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Selenium](https://img.shields.io/badge/-selenium-%43B02A?style=for-the-badge&logo=selenium&logoColor=white)
# Hellcase Odds JS
Javascript porting of this [hellcase-odds](https://github.com/Pajul7/hellcase-odds) repo made by [Pajul7](https://github.com/Pajul7)  

### Node.js script to calculate the profitability of a Hellcase case  
Simply enter the URL of the case and the script will calculate its profitability.  
All costs are calculated in USD ($).
>>>>>>> f1607a1f44d7ca454adfd2bb16fa396bda31bcc3

## How to use
### ⚠️ Firefox users: Must have [GeckoDriver](https://github.com/mozilla/geckodriver/releases) installed first on your computer
### ⚠️ Chrome users: Must have [ChromeDriver](https://github.com/mozilla/geckodriver/releases) installed first on your computer
### `Others browsers are not supported yet`

1. Clone the repo using `git clone https://github.com/felschrr/hellcase-odds-js`
2. Go into the repo folder using `cd hellcase-odds-js`
3. Download dependencies using `npm install`
<<<<<<< HEAD
4. Start the script you are willing to use `node *script_name*.js`

   **Those next steps only applies if you use `script.js`**
5. Choose the browser your using by entering either `chrome` or `firefox`
6. Enter a Hellcase case URL: (e.g) `https://hellcase.com/en/open/covert`
7. When done, press `Enter` if you want to calculate another case profitability, if not type `exit` to exit the script

## Known bugs 🐛

=======
4. Start the script using `node index.js`
5. Choose the browser your using by entering either `chrome` or `firefox` 
6. Enter a Hellcase case URL: (e.g) `https://hellcase.com/en/open/covert`
7. When done, press `Enter` if you want to calculate another case profitability, if not type `exit` to exit the script

## Known bugs :bug:
>>>>>>> f1607a1f44d7ca454adfd2bb16fa396bda31bcc3
* [ ] The 4th most expensive skin variant is not taken into account
* [ ] Chrome is not working yet
