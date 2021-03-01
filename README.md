# Instructions

**Prerequisites.** Ensure that you have `node` and `yarn` installed. If you
would also like to run the analysis on your own, ensure the following packages
are installed for python3:

```
nltk matplotlib pandas numpy scikit-learn beautifulsoup4 selenium
```

**Visualization.** Once you have verified that `node` and `yarn` are installed,
navigate to the root folder of this project and run `yarn install` to install 
the required packages. Then run `npm run live` to compile and start a local
server. Navigate to <http://localhost:5000/dist> to view.

**Analysis.** To download and analyze emails for yourself, first run the 
`data/ArchiveScraper.py` script and then `data/process_emails.py`. 